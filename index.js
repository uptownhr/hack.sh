"use strict"
const app = require('./bootstrap'),
  controllers = require('./controllers'),
  models = require('./models'),
  passport = require('./config/passport')

app.use('/', controllers.Home)
app.use('/blog', controllers.Post)
app.use('/auth', controllers.Auth)
app.use('/user', passport.isAuthenticated, controllers.User)
app.use('/admin', passport.isAuthenticated, passport.isAdmin, controllers.Admin)
app.use('/github', controllers.Github)

//handle errors passed to next in middlewwares
app.use( function(err, req, res, next){
  console.log('wtf', err)
  res.send(err)
})

module.exports = app