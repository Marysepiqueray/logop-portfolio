{validations.map((v, idx) => (
  <div key={idx} className="medal-card">
    <div className="medal-icon">🏅</div>

    <div>
      <div className="medal-title">
        {v.formation.titre}
      </div>

      <div className="medal-certified">
        Formation certifiée
      </div>

      <div className="small">
        Validée le {v.date_validation}
      </div>

      <div className="small" style={{ marginTop: 6 }}>
        Durée : {v.formation.duree_heures ?? 0}h
        {v.formation.niveau && <> • Niveau : {v.formation.niveau}</>}
      </div>

      {v.formation.competences && (
        <div className="small" style={{ marginTop: 6 }}>
          Compétences : {v.formation.competences}
        </div>
      )}
    </div>
  </div>
))}
