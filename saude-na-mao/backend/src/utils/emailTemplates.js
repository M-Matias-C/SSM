module.exports = {
  orderConfirmation: (order) => ({
    subject: `Pedido #${order._id} confirmado`,
    html: `<h1>Pedido Confirmado</h1><p>Obrigado por sua compra!</p>`,
  }),
  
  orderShipped: (order) => ({
    subject: `Pedido #${order._id} enviado`,
    html: `<h1>Seu pedido foi enviado!</h1><p>Número de rastreamento: ${order.trackingNumber}</p>`,
  }),
  
  orderDelivered: (order) => ({
    subject: `Pedido #${order._id} entregue`,
    html: `<h1>Pedido Entregue!</h1><p>Sua compra foi entregue com sucesso.</p>`,
  }),
};
