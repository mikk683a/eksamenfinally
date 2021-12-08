//loader alle enviroment variables og placerer dem i process.env
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

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
// gemmer variablerne i hele brugerens session (på tværs af alle siderne)
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
    fs.writeFileSync('database/users.json', JSON.stringify(users, null, 2))
    console.log(users)
  } 
  catch {
    // ved fejl, redirect til register siden
    res.redirect('/register')
  }
  console.log(users)
})

// gør at der kan logges ud, og redirecter til login siden
app.delete('/logout', (req, res) => {
  //logOut funktion automatisk sat op af passport
  req.logOut()
  res.redirect('/login')
})
//css ej
app.use(express.static('views'));

//middleware funktion, tjekker bruger oplysninger
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

// hvis du er logget, kan den function bruges så man ikke kan gå tilbage til login eller registrer side, istedet redirectes der til homepage
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

//gemmer vores varer i dette tomme array
const goods = [];

// render til /goods
app.get("/goods", (req, res) => {
  res.render('goods.ejs', {
      name: req.user.name,
      goods: goods
  })
})

// poster til homepage
app.post("/", checkAuthenticated, (req, res) => {
  // pusher følgende ting til arrayet "goods"
goods.push({
      pris: req.body.pris,
      kategori: req.body.kategori,
      beskrivelse: req.body.beskrivelse,
      billede: req.body.billede
  })
  res.redirect('/goods')
  // gemmer varer som json objekter i goods.json
  fs.writeFileSync('database/goods.json', JSON.stringify(goods, null, 2))
  console.log(goods)
})

//slet varer
app.delete('/goods', checkAuthenticated, (req, res) => {
goods.splice(0, goods.length)
res.redirect('/')
//sletter varer fra goods.json
fs.writeFileSync('database/goods.json', JSON.stringify(goods, null, 2))
console.log('varer slettet')
})

// slet profil
app.delete('/', checkAuthenticated, (req, res) => {
req.logOut(users.splice(0, users.length))
res.redirect('/login')
//sletter profil fra users.json
fs.writeFileSync('database/users.json', JSON.stringify(users, null, 2))
})

//Opdater profil
app.get("/updateprofile", checkAuthenticated, (req, res) => {
res.render("updateprofile.ejs")
})
app.put("/updateprofile", async (req, res) => {
try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    // pusher opdateret information til arrayet "users"
    users.push({
        id: req.user.id,
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    })
   //sletter eksisterende oplysninger ved hjælp af splice
    users.splice(0, 1);  
    res.redirect("/") 
    // henter opdateret information fra arrayet users og skriver det til users.json
    fs.writeFileSync('database/users.json', JSON.stringify(users, null, 2)); 
    console.log(users) 
} catch {
    res.redirect("/updateprofile") 
}
})