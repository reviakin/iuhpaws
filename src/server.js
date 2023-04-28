const fastify = require('fastify')({ logger: true });
const { WebSocketApi, NetworkEnum, AuctionCalculator, FusionSDK } = require('@1inch/fusion-sdk');
const { OpenoceanSdk } = require('@openocean.finance/openocean-sdk');
const EventEmitter = require('events');

// create Fucion Event emitter
class FusionEmitter extends EventEmitter { };
const fusionEmitter = new FusionEmitter;

// create fucion sdk instance
const fucionSDK = new FusionSDK({
  url: 'https://fusion.1inch.io',
  network: NetworkEnum.ETHEREUM
});
// create a lazy instance
const fucionWS = new WebSocketApi({
  url: 'wss://fusion.1inch.io/ws',
  network: NetworkEnum.ETHEREUM,
  lazyInit: true
});

const openoceanSDK = new OpenoceanSdk();
fucionWS.order.onOrder(async (data) => {
  console.log('received order event', data);
  if (data.event === 'order_created') {

    const calculator = AuctionCalculator.fromLimitOrderV3Struct(data.result.order)
    console.log(calculator);
    const quote = await fucionSDK.getQuote({
      fromTokenAddress: data.result.order.makerAsset,
      toTokenAddress: data.result.order.takerAsset,
      amount: data.result.order.makingAmount,
    });
    console.log(quote);
    const gasPrice = await openoceanSDK.api.getGasPrice({ chain: quote.networl });
    console.log(gasPrice);
  }
})
// start 
fusionEmitter.on('start', () => {
  fucionWS.init();
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
     fusionEmitter.emit('start');
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
