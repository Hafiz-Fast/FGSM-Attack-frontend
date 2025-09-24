"use client";

import { useState } from "react";
import styles from "./page.module.css"; // import module CSS

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [epsilon, setEpsilon] = useState<number>(0.1);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = "http://127.0.0.1:8000/attack";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setError(null);
  };

  const runAttack = async () => {
    if (!file) {
      setError("Please choose an image file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("epsilon", String(epsilon));

      const resp = await fetch(backendUrl, {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Server error ${resp.status}: ${txt}`);
      }

      const json = await resp.json();

      const advB64 = json.adversarial_image_base64;
      const advDataUrl = `data:image/png;base64,${advB64}`;
      const originalDataUrl = await fileToDataUrl(file);

      setResult({
        clean_prediction: json.clean_prediction,
        clean_probs: json.clean_probs,
        adversarial_prediction: json.adversarial_prediction,
        adversarial_probs: json.adversarial_probs,
        attack_success: json.attack_success,
        epsilon: json.epsilon,
        adversarialDataUrl: advDataUrl,
        originalDataUrl,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>FGSM Demo UI</h1>

        {/* File Upload */}
        <div>
          <label className={styles.uploadLabel}>
            Choose image:
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.uploadInput}
            />
          </label>
        </div>

        {/* Epsilon Slider */}
        <div>
          <label className={styles.epsilonLabel}>
            Epsilon: <span className={styles.epsilonValue}>{epsilon}</span>
            <br />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
              className={styles.slider}
            />
          </label>
        </div>

        {/* Run Button */}
        <div>
          <button
            onClick={runAttack}
            disabled={loading}
            className={`${styles.button} ${loading ? styles.buttonDisabled : ""}`}
          >
            {loading ? "Running attack..." : "Run Attack"}
          </button>
        </div>

        {/* Error Message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Results */}
        {result && (
          <div className={styles.resultContainer}>
            <div className={styles.attackStatus}>
              <strong>Attack success:</strong>{" "}
              <span className={result.attack_success ? styles.success : styles.failure}>
                {String(result.attack_success)}
              </span>
            </div>
            <div className={styles.predInfo}>
              <strong>Clean pred:</strong> {result.clean_prediction} {" | "}
              <strong>Adv pred:</strong> {result.adversarial_prediction} {" | "}
              <strong>Epsilon:</strong>{" "}
              <span className={styles.epsilonValue}>{result.epsilon}</span>
            </div>

            <div className={styles.imagesWrapper}>
              <div className={styles.imageCard}>
                <div style={{ fontWeight: 600 }}>Original</div>
                <img src={result.originalDataUrl} alt="original" />
              </div>
              <div className={styles.imageCard}>
                <div style={{ fontWeight: 600 }}>Adversarial</div>
                <img src={result.adversarialDataUrl} alt="adversarial" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// helper
function fileToDataUrl(file: File): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = (e) => reject(e);
    r.readAsDataURL(file);
  });
}