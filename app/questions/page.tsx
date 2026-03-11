"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function QuestionsPage() {
  const [loading, setLoading] = useState(true);
  const [membre, setMembre] = useState<any>(null);

  const [questions, setQuestions] = useState<any[]>([]);
  const [reponses, setReponses] = useState<any[]>([]);

  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [reponsesInput, setReponsesInput] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    const userId = user?.id;
    const email = user?.email?.toLowerCase().trim();

    if (!userId || !email) {
      window.location.href = "/";
      return;
    }

    const { data: m, error: mError } = await supabase
      .from("membres")
      .select("*")
      .ilike("email", email)
      .eq("membre_asbl", true)
      .maybeSingle();

    if (mError || !m) {
      alert("Accès réservé aux membres actifs.");
      window.location.href = "/";
      return;
    }

    const { data: q, error: qErr } = await supabase
      .from("questions_cliniques")
      .select("id, titre, contenu, created_at, membre:membres(nom)")
      .order("created_at", { ascending: false });

    if (qErr) {
      alert(qErr.message);
      return;
    }

    const { data: r, error: rErr } = await supabase
      .from("reponses_questions")
      .select("id, question_id, contenu, created_at, membre:membres(nom)")
      .order("created_at", { ascending: true });

    if (rErr) {
      alert(rErr.message);
      return;
    }

    setMembre(m);
    setQuestions(q ?? []);
    setReponses(r ?? []);
    setLoading(false);
  }

  async function addQuestion() {
    if (!membre?.id) return alert("Membre introuvable");
    if (!titre.trim()) return alert("Titre obligatoire");
    if (!contenu.trim()) return alert("Contenu obligatoire");

    const { error } = await supabase.from("questions_cliniques").insert({
      membre_id: membre.id,
      titre: titre.trim(),
      contenu: contenu.trim(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTitre("");
    setContenu("");
    await loadData();
  }

  async function addReponse(questionId: string) {
    if (!membre?.id) return alert("Membre introuvable");

    const texte = (reponsesInput[questionId] ?? "").trim();
    if (!texte) return alert("Réponse obligatoire");

    const { error } = await supabase.from("reponses_questions").insert({
      question_id: questionId,
      membre_id: membre.id,
      contenu: texte,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setReponsesInput((prev) => ({ ...prev, [questionId]: "" }));
    await loadData();
  }

  const reponsesParQuestion = reponses.reduce((acc: any, r: any) => {
    if (!acc[r.question_id]) acc[r.question_id] = [];
    acc[r.question_id].push(r);
    return acc;
  }, {});

  if (loading) {
    return <main className="card">Chargement…</main>;
  }

  return (
    <main className="card">
      <h1 className="h1">Questions cliniques</h1>

      <p className="p">
        Posez vos questions au réseau et échangez entre logopèdes.
      </p>

      <hr className="hr" />

      <h2>Poser une question</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 800 }}>
        <input
          className="input"
          placeholder="Titre de la question"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Décrivez votre question clinique"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
        />

        <button className="button" onClick={addQuestion}>
          Publier la question
        </button>
      </div>

      <hr className="hr" />

      <h2>Questions du réseau</h2>

      {questions.length === 0 ? (
        <p className="p">Aucune question pour le moment.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {questions.map((q: any) => (
            <div key={q.id} className="badge-tile" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <div className="badge-tile-title">{q.titre}</div>

                <div className="badge-tile-meta" style={{ marginBottom: 8 }}>
                  Par {q.membre?.nom ?? "Membre"} — {new Date(q.created_at).toLocaleDateString("fr-BE")}
                </div>

                <div className="p" style={{ marginBottom: 12 }}>
                  {q.contenu}
                </div>

                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  {(reponsesParQuestion[q.id] ?? []).map((r: any) => (
                    <div key={r.id} className="small" style={{ paddingLeft: 10, borderLeft: "3px solid #d1d5db" }}>
                      <b>{r.membre?.nom ?? "Membre"}</b> — {new Date(r.created_at).toLocaleDateString("fr-BE")}
                      <div style={{ marginTop: 4 }}>{r.contenu}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <textarea
                    className="input"
                    placeholder="Répondre à cette question"
                    value={reponsesInput[q.id] ?? ""}
                    onChange={(e) =>
                      setReponsesInput((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                  />

                  <button className="button secondary" onClick={() => addReponse(q.id)}>
                    Répondre
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
