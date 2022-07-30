const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: list, create, read, update, delete

function list(req, res, next) {
  res.json({ data: orders });
}

// middleware validation
function bodyHasValidProperty(propertyName) {
  return (req, res, next) => {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function validDishesProperty(req, res, next) {
  const { data: { dishes = [] } = {} } = req.body;
  if (dishes.length > 0) return next();
  next({ status: 400, message: `Order must include at least one dish` });
}

function validQuantityProperty(req, res, next) {
  const { data: { dishes = [] } = {} } = req.body;
  for (let i = 0; i < dishes.length; i++) {
    if (dishes[i].quantity <= 0 || typeof dishes[i].quantity !== "number") {
        const index = i;
        return next({ status: 400, message: `dish ${index} must have a quantity that is an integer greater than 0`});
    }
  }
  next();
}

function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function validateOrderBodyId(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id) {
        if (orderId === id) return next()
        next({ status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`});
    }
    next();
}

function validateOrderId(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order)=> order.id === orderId);
    if (orderId) {
      if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({ status: 404, message: `Order id does not exist: ${orderId}`});
  }
  next();
}

function read (req, res, next) {
    const order = res.locals.order;
    res.json({ data: order });
}

function validStatusProperty(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status) {
    switch (status) {
      case "pending":
        return next()
        break;
      case "preparing":
        return next()
        break;
      case "out-for-delivered":
        return next()
        break;
      case "delivered":
        return next({ status: 400, message: `A delivered order cannot be changed`})
        break;
        default:
          return next({ status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered`})
    }
  }
  next({ status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered`}); 
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: {deliverTo, mobileNumber, status, dishes} = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function checkStatusForPending(req, res, next) {
  const order = res.locals.order;
  if (order.status === "pending") return next();
  next({ status: 400, message: `An order cannot be deleted unless it is pending`})
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order)=> order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyHasValidProperty("deliverTo"),
    bodyHasValidProperty("mobileNumber"),
    bodyHasValidProperty("dishes"),
    validDishesProperty,
    validQuantityProperty,
    create
  ],
  read: [validateOrderId, read],
  update: [
    validateOrderId,
    validateOrderBodyId,
    bodyHasValidProperty("deliverTo"),
    bodyHasValidProperty("mobileNumber"),
    bodyHasValidProperty("dishes"),
    validDishesProperty,
    validQuantityProperty,
    validStatusProperty,
    update
  ],
  delete: [
    validateOrderId,
    checkStatusForPending,
    destroy
  ],
};
