const express = require('express')
  const app = express()

   // gør det muligt at hashe passwords og sammenligne hashed passwords
   const bcrypt = require('bcrypt')

     //anvendte biblioteker
  const fs = require('fs')
  const passport = require('passport')
  const flash = require('express-flash')
  const session = require('express-session')
  const methodOverride = require('method-override')
  const formData = require('express-form-data')

  // importerer passport-config.js
  const initializePassport = require('./passport-config')
  initializePassport(
    passport,
    //find brugeren på baggrund af email
    email => users.find(user => user.email === email),
    //find brugeren på baggrund af id
    id => users.find(user => user.id === id)
  )

  // gemmer brugerene og deres oplysninger i dette array
  const users = []
  
  // fortæller serveren at der bruges ejs syntax
  app.set('view-engine', 'ejs')
  
  //fortæller appikalationen at man gerne vil acces ting som email og password. dette
  // er brugt i en request variabel under en post metode (se linje 61-69)
  app.use(express.urlencoded({ extended: false }))
  
  // middleware, så serveren ved hvordan den skal bruge passport
  app.use(flash())
  app.use(session({
      // krypterer information
    secret: process.env.SESSION_SECRET,
    // resaver ikke session variabler, når der ikke er noget at gemme
    resave: false,
    // gemmmer ikke tomme værdier i session
    saveUninitialized: false
  }))

  // hoved funktionen fra passport-config.js
  app.use(passport.initialize())
  // gemmer værdierne i hele brugerens session (på tværs af alle siderne)
  app.use(passport.session())
  app.use(methodOverride('_method'))
  
  //sti og render til hjemmesiden(index.js)
  app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name, goods: goods })
  })
  
  //sti og rendertil Login(login.ejs)
  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
  })
  
  // poster til Login og tjekker passport 
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    //korrekte login oplysninger = redirect til hjemmeside
    successRedirect: '/',
    //forkerte login oplysninger = redirect til login side
    failureRedirect: '/login',
    // viser besked ved fejl i login, referer til beskeder defineret i passport-config.js, afhængigt af fejlen
    failureFlash: true
  }))
  
  //sti og render til register(register.ejs)
  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
  })
  
  //appikalation til at registrer brugere
  app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.name,
        email: req.body.email,
        // bruger hashedpassword, da det er sikkert at gemme i Database.
        password: hashedPassword
      })
      res.redirect('/login')
    
      // gemmer brugere i databasen (users.json)
      fs.writeFileSync('database/users.json', JSON.stringify(users))
      console.log(users)
    } 
    catch {
      // ved fejl, redirect til register siden
      res.redirect('/register')
    }
    console.log(users)
  })



  app.listen(3000)