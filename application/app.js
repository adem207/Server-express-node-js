const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const app = express();

const secretKey = 'clelcecle'; // Assurez-vous d'utiliser une clé secrète sécurisée et stockée en toute sécurité

// Configuration de la connexion à la base de données
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root', // Remplacez par le mot de passe correct pour votre utilisateur MySQL
  database: 'journal_perso' // Assurez-vous que le nom de la base de données est correct
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    return;
  }
  console.log('Connecté à la base de données MySQL avec succès !');
});

// Middleware pour parser le body des requêtes
app.use(express.json());

// Route pour créer un nouvel utilisateur avec mot de passe haché
app.post('/register', (req, res) => {
  const { nom, email, mot_de_passe } = req.body;

  // Hachage du mot de passe avant l'enregistrement
  bcrypt.hash(mot_de_passe, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ message: 'Erreur lors du hachage du mot de passe' });

    // Insertion de l'utilisateur avec le mot de passe haché
    const sql = 'INSERT INTO utilisateur (nom, email, mot_de_passe) VALUES (?, ?, ?)';
    db.query(sql, [nom, email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', err);
        return res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'utilisateur' });
      }
      res.status(201).json({ message: 'Utilisateur enregistré avec succès' });
    });
  });
});

// Route de connexion qui génère un JWT
app.post('/login', (req, res) => {
  const { email, mot_de_passe } = req.body;

  const sql = 'SELECT * FROM utilisateur WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(mot_de_passe, user.mot_de_passe, (err, match) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la comparaison des mots de passe' });
        if (match) {
          const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
          res.json({ token });
        } else {
          res.status(401).json({ message: 'Identifiants invalides' });
        }
      });
    } else {
      res.status(401).json({ message: 'Identifiants invalides' });
    }
  });
});

// Middleware pour vérifier le JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Route protégée pour récupérer les informations de l'utilisateur
app.get('/user', authenticateJWT, (req, res) => {
  const sql = 'SELECT id, nom, email FROM utilisateur WHERE id = ?';
  db.query(sql, [req.user.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la récupération des données utilisateur' });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  });
});
// Route protégée pour supprimer un utilisateur
app.delete('/user', authenticateJWT, (req, res) => {
    const sql = 'DELETE FROM utilisateur WHERE id = ?';
    
    // Utiliser l'ID de l'utilisateur du token décodé pour la suppression
    db.query(sql, [req.user.userId], (err, result) => {
      if (err) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', err);
        return res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
      }
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
      } else {
        res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
    });
  });
  
  // Route protégée pour modifier les informations de l'utilisateur
app.put('/user', authenticateJWT, (req, res) => {
    const { nom, email, mot_de_passe } = req.body;
    const userId = req.user.userId;
  
    // Préparer la requête SQL avec les informations à mettre à jour
    let sql = 'UPDATE utilisateur SET nom = ?, email = ?';
    let values = [nom, email];
  
    if (mot_de_passe) {
      // Hacher le mot de passe si fourni
      bcrypt.hash(mot_de_passe, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ message: 'Erreur lors du hachage du mot de passe' });
  
        sql += ', mot_de_passe = ? WHERE id = ?';
        values.push(hashedPassword, userId);
  
        // Exécuter la requête SQL
        db.query(sql, values, (err, result) => {
          if (err) {
            console.error('Erreur lors de la mise à jour des informations de l\'utilisateur:', err);
            return res.status(500).json({ message: 'Erreur lors de la mise à jour des informations de l\'utilisateur' });
          }
          if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Informations de l\'utilisateur mises à jour avec succès' });
          } else {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
          }
        });
      });
    } else {
      sql += ' WHERE id = ?';
      values.push(userId);
  
      // Exécuter la requête SQL
      db.query(sql, values, (err, result) => {
        if (err) {
          console.error('Erreur lors de la mise à jour des informations de l\'utilisateur:', err);
          return res.status(500).json({ message: 'Erreur lors de la mise à jour des informations de l\'utilisateur' });
        }
        if (result.affectedRows > 0) {
          res.status(200).json({ message: 'Informations de l\'utilisateur mises à jour avec succès' });
        } else {
          res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
      });
    }
  });
  

  // Route pour ajouter une entrée de journal
app.post('/journals', authenticateJWT, (req, res) => {
    const { titre, contenu } = req.body;
    const id_utilisateur = req.user.userId; // Utilise l'ID utilisateur extrait du token JWT
  
    // Préparer la requête SQL pour insérer une nouvelle entrée de journal
    const sql = 'INSERT INTO journal (id_utilisateur, titre, contenu) VALUES (?, ?, ?)';
    db.query(sql, [id_utilisateur, titre, contenu], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'ajout de l\'entrée de journal:', err);
        return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'entrée de journal' });
      }
      res.status(201).json({ message: 'Entrée de journal ajoutée avec succès', id: result.insertId });
    });
  });
  

  // Route pour consulter toutes les entrées de journal de l'utilisateur
app.get('/journals', authenticateJWT, (req, res) => {
    const id_utilisateur = req.user.userId;
  
    // Préparer la requête SQL pour récupérer toutes les entrées de journal de l'utilisateur
    const sql = 'SELECT * FROM journal WHERE id_utilisateur = ?';
    db.query(sql, [id_utilisateur], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération des entrées de journal:', err);
        return res.status(500).json({ message: 'Erreur lors de la récupération des entrées de journal' });
      }
      res.json(results);
    });
  });
  

  // Route pour modifier une entrée de journal
app.put('/journals/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;
    const { titre, contenu } = req.body;
    const id_utilisateur = req.user.userId;
  
    // Préparer la requête SQL pour mettre à jour une entrée de journal
    const sql = 'UPDATE journal SET titre = ?, contenu = ? WHERE id = ? AND id_utilisateur = ?';
    db.query(sql, [titre, contenu, id, id_utilisateur], (err, result) => {
      if (err) {
        console.error('Erreur lors de la modification de l\'entrée de journal:', err);
        return res.status(500).json({ message: 'Erreur lors de la modification de l\'entrée de journal' });
      }
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Entrée de journal modifiée avec succès' });
      } else {
        res.status(404).json({ message: 'Entrée de journal non trouvée ou vous n\'êtes pas autorisé à la modifier' });
      }
    });
  });

  // Route pour supprimer une entrée de journal
app.delete('/journals/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;
    const id_utilisateur = req.user.userId;
  
    // Préparer la requête SQL pour supprimer une entrée de journal
    const sql = 'DELETE FROM journal WHERE id = ? AND id_utilisateur = ?';
    db.query(sql, [id, id_utilisateur], (err, result) => {
      if (err) {
        console.error('Erreur lors de la suppression de l\'entrée de journal:', err);
        return res.status(500).json({ message: 'Erreur lors de la suppression de l\'entrée de journal' });
      }
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Entrée de journal supprimée avec succès' });
      } else {
        res.status(404).json({ message: 'Entrée de journal non trouvée ou vous n\'êtes pas autorisé à la supprimer' });
      }
    });
  });

  // Route pour ajouter une page
app.post('/page', authenticateJWT, (req, res) => {
    const { id_journal, titre, contenu } = req.body;
  
    const sql = 'INSERT INTO page (id_journal, id_utilisateur, titre, contenu) VALUES (?, ?, ?, ?)';
    db.query(sql, [id_journal, req.user.userId, titre, contenu], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'ajout de la page:', err);
        return res.status(500).json({ message: 'Erreur lors de l\'ajout de la page' });
      }
      res.status(201).json({ message: 'Page ajoutée avec succès', pageId: result.insertId });
    });
  });

  // Route pour modifier une page
app.put('/pages/:id', authenticateJWT, (req, res) => {
  const pageId = req.params.id; // ID de la page à modifier
  const { titre, contenu } = req.body;
  const id_utilisateur = req.user.userId; // Utiliser l'ID utilisateur du token JWT

  // Requête SQL pour mettre à jour la page
  const sql = 'UPDATE page SET titre = ?, contenu = ? WHERE id = ? AND id_utilisateur = ?';
  db.query(sql, [titre, contenu, pageId, id_utilisateur], (err, result) => {
    if (err) {
      console.error('Erreur lors de la modification de la page:', err);
      return res.status(500).json({ message: 'Erreur lors de la modification de la page' });
    }
    if (result.affectedRows > 0) {
      res.json({ message: 'Page modifiée avec succès' });
    } else {
      res.status(404).json({ message: 'Page non trouvée ou vous n\'avez pas la permission de la modifier' });
    }
  });
});

// Route pour supprimer une page
app.delete('/pages/:id', authenticateJWT, (req, res) => {
  const pageId = req.params.id; // ID de la page à supprimer
  const id_utilisateur = req.user.userId; // Utiliser l'ID utilisateur du token JWT

  // Requête SQL pour supprimer la page
  const sql = 'DELETE FROM page WHERE id = ? AND id_utilisateur = ?';
  db.query(sql, [pageId, id_utilisateur], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de la page:', err);
      return res.status(500).json({ message: 'Erreur lors de la suppression de la page' });
    }
    if (result.affectedRows > 0) {
      res.json({ message: 'Page supprimée avec succès' });
    } else {
      res.status(404).json({ message: 'Page non trouvée ou vous n\'avez pas la permission de la supprimer' });
    }
  });
});


  
  // Démarrer le serveur
  app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
  });
  
  


