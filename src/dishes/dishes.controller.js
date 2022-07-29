const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


function list(req, res, next) {
  res.json({ data: dishes });
}

// middleware validation
function bodyHasValidProperty(propertyName) {
  return (req, res, next) => {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function validPriceProperty(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price > 0 && typeof price === "number") {
    return next();
  }
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//stupid fucking test, doesn't make any sense
// function dishIdRouteMatches(req, res, next) {
//     const { dishId } = req.params;
//     if (!dishId) {
//     next({ status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}` });
//   }
//   next();
// }

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}.` });
}

function read(req, res, next) {
  const dish = res.locals.dish;
  res.json({ data: dish });
}

function update(req, res, next) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [
    bodyHasValidProperty("name"),
    bodyHasValidProperty("description"),
    bodyHasValidProperty("price"),
    bodyHasValidProperty("image_url"),
    validPriceProperty,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHasValidProperty("name"),
    bodyHasValidProperty("description"),
    bodyHasValidProperty("price"),
    bodyHasValidProperty("image_url"),
    validPriceProperty,
    update,
  ],
};
