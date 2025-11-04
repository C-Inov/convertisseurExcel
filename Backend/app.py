from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Configuration MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:password@localhost/ecole_emploi_temps'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modèles de base de données
class AnneeScolaire(db.Model):
    __tablename__ = 'annee_scolaire'
    id = db.Column(db.Integer, primary_key=True)
    annee = db.Column(db.String(20), nullable=False)
    date_debut = db.Column(db.Date, nullable=False)
    date_fin = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    classes = db.relationship('Classe', backref='annee_scolaire', cascade='all, delete-orphan')
    emplois = db.relationship('EmploiDuTemps', backref='annee_scolaire', cascade='all, delete-orphan')

class Salle(db.Model):
    __tablename__ = 'salle'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(50), nullable=False)
    annee_id = db.Column(db.Integer, db.ForeignKey('annee_scolaire.id'), nullable=False)
    
    classes = db.relationship('Classe', backref='salle')

class Classe(db.Model):
    __tablename__ = 'classe'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(50), nullable=False)
    salle_id = db.Column(db.Integer, db.ForeignKey('salle.id'), nullable=False)
    annee_id = db.Column(db.Integer, db.ForeignKey('annee_scolaire.id'), nullable=False)
    
    matieres = db.relationship('Matiere', backref='classe', cascade='all, delete-orphan')

class Matiere(db.Model):
    __tablename__ = 'matiere'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    classe_id = db.Column(db.Integer, db.ForeignKey('classe.id'), nullable=False)
    heures_annee = db.Column(db.Integer, default=0)
    heures_semaine = db.Column(db.Integer, default=0)
    heures_jour = db.Column(db.Integer, default=0)

class EmploiDuTemps(db.Model):
    __tablename__ = 'emploi_du_temps'
    id = db.Column(db.Integer, primary_key=True)
    jour = db.Column(db.String(20), nullable=False)
    horaire = db.Column(db.String(20), nullable=False)
    matiere_nom = db.Column(db.String(100), nullable=False)
    classe_nom = db.Column(db.String(50), nullable=False)
    salle_nom = db.Column(db.String(50), nullable=False)
    annee_id = db.Column(db.Integer, db.ForeignKey('annee_scolaire.id'), nullable=False)

# Routes API
@app.route('/api/annee-scolaire', methods=['POST'])
def create_annee_scolaire():
    """Créer une nouvelle année scolaire avec toutes les informations"""
    try:
        data = request.json
        
        # Créer l'année scolaire
        annee = AnneeScolaire(
            annee=data['anneeScolaire'],
            date_debut=datetime.strptime(data['dateDebut'], '%Y-%m-%d').date(),
            date_fin=datetime.strptime(data['dateFin'], '%Y-%m-%d').date()
        )
        db.session.add(annee)
        db.session.flush()
        
        # Créer les salles
        salles_map = {}
        for salle_data in data['salles']:
            salle = Salle(
                nom=salle_data['nom'],
                annee_id=annee.id
            )
            db.session.add(salle)
            db.session.flush()
            salles_map[salle_data['id']] = salle.id
        
        # Créer les classes et matières
        for classe_data in data['classes']:
            classe = Classe(
                nom=classe_data['nom'],
                salle_id=salles_map[classe_data['salleId']],
                annee_id=annee.id
            )
            db.session.add(classe)
            db.session.flush()
            
            # Créer les matières pour cette classe
            for matiere_data in data['matieres']:
                heures = matiere_data['heuresParClasse'].get(classe_data['id'], {})
                if heures and heures.get('jour', 0) > 0:
                    matiere = Matiere(
                        nom=matiere_data['nom'],
                        classe_id=classe.id,
                        heures_annee=heures.get('annee', 0),
                        heures_semaine=heures.get('semaine', 0),
                        heures_jour=heures.get('jour', 0)
                    )
                    db.session.add(matiere)
        
        # Créer l'emploi du temps
        for emploi_data in data['emploiDuTemps']:
            emploi = EmploiDuTemps(
                jour=emploi_data['jour'],
                horaire=emploi_data['horaire'],
                matiere_nom=emploi_data['matiere'],
                classe_nom=emploi_data['classe'],
                salle_nom=emploi_data['salle'],
                annee_id=annee.id
            )
            db.session.add(emploi)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Année scolaire créée avec succès',
            'id': annee.id
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/annee-scolaire/<int:id>', methods=['GET'])
def get_annee_scolaire(id):
    """Récupérer une année scolaire avec toutes ses informations"""
    try:
        annee = AnneeScolaire.query.get_or_404(id)
        
        # Récupérer toutes les données associées
        salles = Salle.query.filter_by(annee_id=id).all()
        classes = Classe.query.filter_by(annee_id=id).all()
        emplois = EmploiDuTemps.query.filter_by(annee_id=id).all()
        
        # Construire la réponse
        data = {
            'id': annee.id,
            'anneeScolaire': annee.annee,
            'dateDebut': annee.date_debut.strftime('%Y-%m-%d'),
            'dateFin': annee.date_fin.strftime('%Y-%m-%d'),
            'salles': [{'id': s.id, 'nom': s.nom} for s in salles],
            'classes': [],
            'emploiDuTemps': [{
                'jour': e.jour,
                'horaire': e.horaire,
                'matiere': e.matiere_nom,
                'classe': e.classe_nom,
                'salle': e.salle_nom
            } for e in emplois]
        }
        
        # Ajouter les classes avec leurs matières
        for classe in classes:
            matieres = Matiere.query.filter_by(classe_id=classe.id).all()
            data['classes'].append({
                'id': classe.id,
                'nom': classe.nom,
                'salleId': classe.salle_id,
                'matieres': [{
                    'id': m.id,
                    'nom': m.nom,
                    'heuresAnnee': m.heures_annee,
                    'heuresSemaine': m.heures_semaine,
                    'heuresJour': m.heures_jour
                } for m in matieres]
            })
        
        return jsonify({'success': True, 'data': data})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 404

@app.route('/api/annee-scolaire/<int:id>', methods=['PUT'])
def update_annee_scolaire(id):
    """Mettre à jour une année scolaire"""
    try:
        annee = AnneeScolaire.query.get_or_404(id)
        data = request.json
        
        # Mettre à jour les informations de base
        annee.annee = data.get('anneeScolaire', annee.annee)
        if 'dateDebut' in data:
            annee.date_debut = datetime.strptime(data['dateDebut'], '%Y-%m-%d').date()
        if 'dateFin' in data:
            annee.date_fin = datetime.strptime(data['dateFin'], '%Y-%m-%d').date()
        
        # Supprimer l'ancien emploi du temps
        EmploiDuTemps.query.filter_by(annee_id=id).delete()
        
        # Créer le nouvel emploi du temps
        if 'emploiDuTemps' in data:
            for emploi_data in data['emploiDuTemps']:
                emploi = EmploiDuTemps(
                    jour=emploi_data['jour'],
                    horaire=emploi_data['horaire'],
                    matiere_nom=emploi_data['matiere'],
                    classe_nom=emploi_data['classe'],
                    salle_nom=emploi_data['salle'],
                    annee_id=annee.id
                )
                db.session.add(emploi)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Année scolaire mise à jour avec succès'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/annee-scolaire', methods=['GET'])
def list_annees_scolaires():
    """Lister toutes les années scolaires"""
    try:
        annees = AnneeScolaire.query.order_by(AnneeScolaire.created_at.desc()).all()
        
        data = [{
            'id': a.id,
            'annee': a.annee,
            'dateDebut': a.date_debut.strftime('%Y-%m-%d'),
            'dateFin': a.date_fin.strftime('%Y-%m-%d'),
            'nbClasses': len(a.classes)
        } for a in annees]
        
        return jsonify({'success': True, 'data': data})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/annee-scolaire/<int:id>', methods=['DELETE'])
def delete_annee_scolaire(id):
    """Supprimer une année scolaire"""
    try:
        annee = AnneeScolaire.query.get_or_404(id)
        db.session.delete(annee)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Année scolaire supprimée avec succès'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

# Initialisation de la base de données
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)