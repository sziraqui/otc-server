const express = require("express");
const path = require("path");
const showError = require("http-errors");

let app = express();

// Setup server
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/", require("./routes/main"));

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(showError(404));
});

// error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") == "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
