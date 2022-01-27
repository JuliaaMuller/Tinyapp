const emailLookUp = (email, database) => {
  // pour vérifier si l'email existe déjà dans users
  for (let data in database) {
    if (database[data]["email"] === email) {
      return data;
    }
  }
};

module.exports = emailLookUp