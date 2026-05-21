import React, { useState, useEffect } from 'react';

const trapmf = (x, a, b, c, d) => Math.max(0, Math.min((x - a) / (b - a || 1e-5), 1, (d - x) / (d - c || 1e-5)));
const trimf = (x, a, b, c) => Math.max(0, Math.min((x - a) / (b - a || 1e-5), (c - x) / (c - b || 1e-5)));

export default function FuzzyEmulator() {
  // Valores iniciales basados en el Caso Base
  const [acoplamiento, setAcoplamiento] = useState(0.85);
  const [complejidad, setComplejidad] = useState(35);
  const [distancia, setDistancia] = useState(0.25);
  
  const [resultado, setResultado] = useState({ riesgo: 0, etiqueta: '', color: '' });

  useEffect(() => {
    // 1. Fuzzificación
    const ae_bajo = trapmf(acoplamiento, 0, 0, 0.2, 0.4);
    const ae_medio = trimf(acoplamiento, 0.3, 0.5, 0.7);
    const ae_alto = trapmf(acoplamiento, 0.6, 0.8, 1, 1);

    const cc_aceptable = trapmf(complejidad, 1, 1, 10, 20);
    const cc_moderada = trimf(complejidad, 15, 25, 35);
    const cc_compleja = trapmf(complejidad, 30, 40, 50, 50);

    const dse_cercana = trapmf(distancia, 0, 0, 0.2, 0.4);
    const dse_tolerable = trimf(distancia, 0.3, 0.5, 0.7);
    const dse_lejana = trapmf(distancia, 0.6, 0.8, 1, 1);

    // 2. Base de Reglas (Operador MIN para conjunción)
    const r1_critico = Math.min(ae_alto, dse_lejana);
    const r2_alto = Math.min(cc_compleja, ae_medio);
    const r3_moderado = Math.min(cc_moderada, dse_tolerable);
    const r4_minimo = Math.min(ae_bajo, cc_aceptable, dse_cercana);
    const r5_moderado = Math.min(ae_alto, cc_aceptable, dse_cercana);
    const r6_alto = Math.min(ae_alto, cc_compleja, dse_cercana); // Regla del Caso Base

    // 3. Agregación (Operador MAX)
    const out_minimo = r4_minimo;
    const out_moderado = Math.max(r3_moderado, r5_moderado);
    const out_alto = Math.max(r2_alto, r6_alto);
    const out_critico = r1_critico;

    // 4. Defusificación (Promedio ponderado de los centros para la simulación UI)
    const num = (out_minimo * 15) + (out_moderado * 40) + (out_alto * 70) + (out_critico * 90);
    const den = out_minimo + out_moderado + out_alto + out_critico;
    const riesgoFinal = den === 0 ? 0 : num / den;

    // 5. Asignación de etiquetas y estilos para el Gauge
    let etiqueta = 'INDETERMINADO';
    let color = 'text-gray-400';
    let strokeColor = '#9ca3af';

    if (riesgoFinal >= 80) { etiqueta = 'CRÍTICO'; color = 'text-red-400'; strokeColor = '#f87171'; }
    else if (riesgoFinal >= 60) { etiqueta = 'ALTO'; color = 'text-blue-400'; strokeColor = '#60a5fa'; }
    else if (riesgoFinal >= 30) { etiqueta = 'MODERADO'; color = 'text-yellow-400'; strokeColor = '#facc15'; }
    else { etiqueta = 'MÍNIMO'; color = 'text-green-400'; strokeColor = '#4ade80'; }

    setResultado({ riesgo: riesgoFinal.toFixed(1), etiqueta, color, strokeColor });
  }, [acoplamiento, complejidad, distancia]);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((resultado.riesgo / 100) * circumference) / 2;

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex items-center justify-center p-6 font-sans">
      {/* Contenedor principal con Glassmorphism y Squircle */}
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
        
        {/* Panel del Medidor (Gauge) */}
        <div className="flex flex-col items-center mb-10 relative">
          <div className="relative w-64 h-36 overflow-hidden">
            <svg className="w-full h-full transform -rotate-180 origin-center" viewBox="0 0 200 100">
              {/* Fondo del arco */}
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#374151" strokeWidth="16" />
              {/* Arco dinámico */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={resultado.strokeColor}
                strokeWidth="16"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 text-center flex flex-col items-center">
              <span className="text-5xl font-bold tracking-tight">{resultado.riesgo}%</span>
              <span className={`text-sm font-semibold tracking-widest mt-1 ${resultado.color}`}>
                {resultado.etiqueta}
              </span>
            </div>
          </div>
        </div>

        {/* Separador sutil */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"></div>

        {/* Panel de Controles (Sliders) */}
        <div className="space-y-6">
          <ControlSlider 
            label="Acoplamiento Estructural" 
            value={acoplamiento} 
            setValue={setAcoplamiento} 
            min={0} max={1} step={0.01} 
          />
          <ControlSlider 
            label="Complejidad Ciclomática" 
            value={complejidad} 
            setValue={setComplejidad} 
            min={1} max={50} step={1} 
          />
          <ControlSlider 
            label="Distancia Semántica" 
            value={distancia} 
            setValue={setDistancia} 
            min={0} max={1} step={0.01} 
          />
        </div>

      </div>
    </div>
  );
}

// Subcomponente estilizado para los controles
function ControlSlider({ label, value, setValue, min, max, step }) {
  return (
    <div className="flex items-center justify-between group">
      <label className="text-sm font-medium text-gray-300 w-1/3 group-hover:text-white transition-colors">
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="w-1/2 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300 transition-all"
      />
      <div className="w-16 flex justify-end">
        <span className="px-3 py-1 bg-white/10 border border-white/5 rounded-xl text-sm font-mono shadow-inner">
          {value}
        </span>
      </div>
    </div>
  );
}
