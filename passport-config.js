const LocalStrategy = require('passport-local').Strategy 
const bcrypt = require('bcrypt')
 
function initialize(passport, getUserByEmail, getUserById) {
  // bruger email og adgangskode til at verificere brugeren
  const authenticateUser = async (email, password, done) => {
    //ingen bruger med angivne mail = ingen fejlkode, men message 
    const user = getUserByEmail(email)
    if (user == null) {
      return done(null, false, { message: 'Ingen bruger med denne email' })
    }

    // tjekker om Adgangskoden matcher den der blev angivet ved registrering 
    // match = login, ingen match = ingenfejlkode, men message:
    // try/catch grundet async kode
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Forkert Adgangskode' })
      }
    } catch (e) {
      return done(e)
    } 
  }
// forklarer passport, at vi bruger email, som vores username
  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  
  //oversætter data strukturen til et format der i dette tilfælde kan gemmes i session
  passport.serializeUser((user, done) => done(null, user.id))
  //rekonstruktuerer data strukturen 
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id))
  })
}

// exporterer intialize functionen, så den kan tilgås i server.js
module.exports = initialize