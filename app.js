const express = require('express')
const path = require('path')
const hbs = require('hbs')
const cookieParser = require('cookie-parser')
const { db } = require('./DB')
const { db2 } = require('./DB2')
const { sessions } = require('./sessions')
const { checkAuth } = require('./src/middlewares/checkAuth')

const server = express()
const PORT = process.env.PORT || 3000

server.set('view engine', 'hbs')
server.set('views', path.join(process.env.PWD, 'src', 'views'))
hbs.registerPartials(path.join(process.env.PWD, 'src', 'views', 'partials'))

server.use(express.urlencoded({ extended: true }))
server.use(cookieParser())





server.use((req, res, next) => {
  const sidFromUser = req.cookies.sid

  const currentSession = sessions[sidFromUser]

  if (currentSession) {
    const currentUser = db.users.find((user) => user.email === currentSession.email)
  
    res.locals.name = currentUser.name
  }

  next()
})



server.get('/', (request, response) => {
  const usersQuery = request.query 
  let photoForRender = db2.photo

  if (usersQuery.limit !== undefined && Number.isNaN(+usersQuery.limit) === false) {
    photoForRender = db2.photo.slice(0, usersQuery.limit)
  }

  response.render('main', { listOfPhoto: photoForRender })
})

server.post('/', (req, res) => {
  const dataFromForm = req.body

  db2.photo.push(dataFromForm)

  res.redirect('/')
});

server.get('/', (req, res) => {
  res.render('main')
})


server.get('/auth/signup', (req, res) => {
  res.render('signUp')
})

server.post('/auth/signup', (req, res) => {
  const { name, email, password } = req.body

  db.users.push({
    name,
    email,
    password,
  })

  const sid = Date.now()

  sessions[sid] = {
    email,
  }

  res.cookie('sid', sid, {
    httpOnly: true,
    maxAge: 36e8,
  })

  res.redirect('/')
})

server.get('/auth/signin', (req, res) => {
  res.render('signIn')
})

server.post('/auth/signin', (req, res) => {
  const { email, password } = req.body

  const currentUser = db.users.find((user) => user.email === email)

  if (currentUser) {
    if (currentUser.password === password) {
      const sid = Date.now()

      sessions[sid] = {
        email,
      }

      res.cookie('sid', sid, {
        httpOnly: true,
        maxAge: 36e8,
      })

      return res.redirect('/')
    }
  }

  return res.redirect('/auth/signin')
})

server.get('/auth/signout', (req, res) => {
  const sidFromUserCookie = req.cookies.sid

  delete sessions[sidFromUserCookie]

  res.clearCookie('sid')
  res.redirect('/')
  
})





server.listen(PORT, () => {
  console.log(`OK: ${PORT}`)
})
