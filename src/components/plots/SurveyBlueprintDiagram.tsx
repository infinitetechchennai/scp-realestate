import React from 'react';
import { Plot } from '../../types';

interface SurveyBlueprintDiagramProps {
  selectedPlotNumber?: string;
  onSelectPlot?: (plotNumber: string) => void;
  customImage?: string | null;
}

export const SurveyBlueprintDiagram: React.FC<SurveyBlueprintDiagramProps> = ({
  selectedPlotNumber,
  onSelectPlot,
  customImage,
}) => {
  if (customImage) {
    return (
      <div className="w-full flex items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <img
          src={customImage}
          alt="Master Plan Blueprint"
          className="max-h-[480px] w-auto object-contain rounded-lg shadow-sm"
        />
      </div>
    );
  }

  // High-fidelity SVG CAD Architectural Survey drawing of Greens Ventures Layout
  return (
    <div className="w-full flex items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <svg
        viewBox="0 0 920 620"
        className="w-full max-h-[500px] select-none"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.03))' }}
      >
        <defs>
          {/* Diagonal Hatch Pattern for Available / Standard plots */}
          <pattern
            id="hatchPattern"
            width="12"
            height="12"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke="#d97706" strokeWidth="1.2" opacity="0.35" />
          </pattern>
          {/* Diagonal Hatch for Booked / Confirmed */}
          <pattern
            id="hatchBooked"
            width="12"
            height="12"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke="#94a3b8" strokeWidth="1.2" opacity="0.4" />
          </pattern>
          {/* Active Highlight Pattern */}
          <pattern
            id="hatchActive"
            width="12"
            height="12"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke="#0284c7" strokeWidth="1.8" opacity="0.75" />
          </pattern>
        </defs>

        {/* Background Grid Accent */}
        <rect width="920" height="620" fill="#ffffff" />

        {/* Top Left Logo: Greens Ventures */}
        <g transform="translate(45, 30)">
          <text x="0" y="32" fontFamily="system-ui, sans-serif" fontSize="32" fontWeight="900" fill="#15803d" letterSpacing="-1">
            greens
          </text>
          <text x="1" y="48" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="800" fill="#334155" letterSpacing="3">
            VENTURES
          </text>
          <rect x="0" y="240" width="76" height="24" rx="3" fill="#15803d" />
          <text x="38" y="256" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1">
            GREEN !
          </text>
        </g>

        {/* North Arrow Marker on Top Right */}
        <g transform="translate(670, 25)">
          <path d="M 12 0 L 17 42 L 12 34 L 7 42 Z" fill="#15803d" />
          <line x1="12" y1="34" x2="12" y2="70" stroke="#15803d" strokeWidth="1.5" />
          <text x="12" y="-6" fontFamily="system-ui, sans-serif" fontSize="18" fontWeight="900" fill="#15803d" textAnchor="middle">
            N
          </text>
        </g>

        {/* ── PLOTS GEOMETRY (Survey Boundary Polygons) ── */}
        {/* Plot 2 (Top Left Center) */}
        <g
          className="cursor-pointer transition-all"
          onClick={() => onSelectPlot?.('P-02')}
        >
          <polygon
            points="330,55 400,68 395,148 335,142"
            fill={selectedPlotNumber === 'P-02' ? '#e0f2fe' : '#fef3c7'}
            stroke={selectedPlotNumber === 'P-02' ? '#0284c7' : '#1e293b'}
            strokeWidth={selectedPlotNumber === 'P-02' ? '3' : '1.5'}
          />
          <polygon
            points="330,55 400,68 395,148 335,142"
            fill={selectedPlotNumber === 'P-02' ? 'url(#hatchActive)' : 'url(#hatchPattern)'}
          />
          <circle cx="365" cy="98" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="365" y="102" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">2</text>
          <text x="365" y="118" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">119.45</text>
          <text x="365" y="127" fontSize="7" fontWeight="600" textAnchor="middle" fill="#64748b">(0-3-3-0.10)</text>
          <text x="365" y="50" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">27'-5"</text>
          <text x="320" y="102" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155" transform="rotate(-90 320 102)">52'-10"</text>
          <text x="365" y="156" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">27'-10"</text>
        </g>

        {/* Plot 3 (Top Center) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-03')}>
          <polygon points="400,68 475,80 470,154 395,148" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="400,68 475,80 470,154 395,148" fill="url(#hatchBooked)" />
          <circle cx="435" cy="108" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="435" y="112" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">3</text>
          <text x="435" y="126" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">115.66</text>
          <text x="435" y="64" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">29'-7"</text>
          <text x="435" y="166" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">28'-8"</text>
          <text x="408" y="112" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155" transform="rotate(-90 408 112)">42'-3"</text>
        </g>

        {/* Plot 4 (Top Center-Right) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-04')}>
          <polygon
            points="475,80 545,70 545,150 470,154"
            fill={selectedPlotNumber === 'P-04' ? '#e0f2fe' : '#fef3c7'}
            stroke={selectedPlotNumber === 'P-04' ? '#0284c7' : '#1e293b'}
            strokeWidth={selectedPlotNumber === 'P-04' ? '3' : '1.5'}
          />
          <polygon
            points="475,80 545,70 545,150 470,154"
            fill={selectedPlotNumber === 'P-04' ? 'url(#hatchActive)' : 'url(#hatchPattern)'}
          />
          <circle cx="510" cy="106" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="510" y="110" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">4</text>
          <text x="510" y="124" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">127.16</text>
          <text x="510" y="62" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">30'-1"</text>
          <text x="510" y="164" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">28'-5"</text>
        </g>

        {/* Plot 5 (Top Right) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-05')}>
          <polygon
            points="545,70 610,60 615,145 545,150"
            fill={selectedPlotNumber === 'P-05' ? '#e0f2fe' : '#fef3c7'}
            stroke={selectedPlotNumber === 'P-05' ? '#0284c7' : '#1e293b'}
            strokeWidth={selectedPlotNumber === 'P-05' ? '3' : '1.5'}
          />
          <polygon
            points="545,70 610,60 615,145 545,150"
            fill={selectedPlotNumber === 'P-05' ? 'url(#hatchActive)' : 'url(#hatchPattern)'}
          />
          <circle cx="578" cy="104" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="578" y="108" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">5</text>
          <text x="578" y="122" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">131.80</text>
          <text x="578" y="52" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">28'-3"</text>
          <text x="578" y="160" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">28'-2"</text>
        </g>

        {/* Plot 6 (Far Top Right Corner) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-06')}>
          <polygon points="610,60 660,70 665,115 615,145" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="610,60 660,70 665,115 615,145" fill="url(#hatchBooked)" />
          <circle cx="638" cy="98" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="638" y="102" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">6</text>
          <text x="638" y="115" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">155.95</text>
          <text x="638" y="50" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">29'</text>
          <text x="655" y="138" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">13'-1"</text>
        </g>

        {/* Plot 1 (Far Top Left Wing) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-01')}>
          <polygon points="230,175 390,195 385,250 235,225" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="230,175 390,195 385,250 235,225" fill="url(#hatchBooked)" />
          <circle cx="310" cy="210" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="310" y="214" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">1</text>
          <text x="310" y="228" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">163.01</text>
          <text x="310" y="190" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">54'-5"</text>
          <text x="215" y="200" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155" transform="rotate(-90 215 200)">31'-10"</text>
          <text x="310" y="246" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">51'-8"</text>
          <text x="400" y="222" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155" transform="rotate(-90 400 222)">32'-4"</text>
        </g>

        {/* Plot 16 */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-16')}>
          <polygon points="390,195 480,205 475,260 385,250" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="390,195 480,205 475,260 385,250" fill="url(#hatchBooked)" />
          <circle cx="432" cy="226" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="432" y="230" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">16</text>
          <text x="432" y="244" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">157.16</text>
          <text x="432" y="198" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">48'-3"</text>
          <text x="432" y="272" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">51'-2"</text>
        </g>

        {/* Plot 15 */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-15')}>
          <polygon points="385,250 475,260 470,320 380,310" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="385,250 475,260 470,320 380,310" fill="url(#hatchBooked)" />
          <circle cx="428" cy="285" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="428" y="289" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">15</text>
          <text x="428" y="302" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">151.15</text>
          <text x="428" y="276" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">49'-3"</text>
        </g>

        {/* Plot 14 */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-14')}>
          <polygon points="380,310 470,320 465,378 375,370" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="380,310 470,320 465,378 375,370" fill="url(#hatchBooked)" />
          <circle cx="422" cy="344" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="422" y="348" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">14</text>
          <text x="422" y="360" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">157.27</text>
          <text x="422" y="334" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">49'-11"</text>
        </g>

        {/* Plot 13 (Bottom Center) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-13')}>
          <polygon
            points="375,370 465,378 450,440 380,425"
            fill={selectedPlotNumber === 'P-13' ? '#e0f2fe' : '#fef3c7'}
            stroke={selectedPlotNumber === 'P-13' ? '#0284c7' : '#1e293b'}
            strokeWidth={selectedPlotNumber === 'P-13' ? '3' : '1.5'}
          />
          <polygon
            points="375,370 465,378 450,440 380,425"
            fill={selectedPlotNumber === 'P-13' ? 'url(#hatchActive)' : 'url(#hatchPattern)'}
          />
          <circle cx="420" cy="402" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="420" y="406" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">13</text>
          <text x="420" y="418" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">127.69</text>
          <text x="415" y="455" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">40'-3"</text>
          <text x="365" y="445" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155" transform="rotate(70 365 445)">20'-5"</text>
        </g>

        {/* Plot 12 (Bottom Center-Right) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-12')}>
          <polygon points="495,382 565,385 550,445 490,442" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="495,382 565,385 550,445 490,442" fill="url(#hatchBooked)" />
          <circle cx="530" cy="408" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="530" y="412" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">12</text>
          <text x="530" y="424" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">127.38</text>
          <text x="525" y="380" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">40'-1"</text>
          <text x="525" y="458" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">38'-8"</text>
        </g>

        {/* Plot 11 (Bottom Right Wing) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-11')}>
          <polygon points="565,385 640,410 660,450 550,445" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="565,385 640,410 660,450 550,445" fill="url(#hatchBooked)" />
          <circle cx="595" cy="415" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="595" y="419" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">11</text>
          <text x="595" y="430" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">147.45</text>
          <text x="600" y="460" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">49'-7"</text>
        </g>

        {/* Plot 10 (Right Wing Lower) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-10')}>
          <polygon points="545,315 620,318 620,380 545,375" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="545,315 620,318 620,380 545,375" fill="url(#hatchBooked)" />
          <circle cx="582" cy="344" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="582" y="348" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">10</text>
          <text x="582" y="360" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">131.89</text>
          <text x="582" y="336" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">37'-5"</text>
          <text x="635" y="350" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155" transform="rotate(-90 635 350)">43'-1"</text>
        </g>

        {/* Plot 9 (Right Wing Center) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-09')}>
          <polygon points="545,255 620,258 620,318 545,315" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="545,255 620,258 620,318 545,315" fill="url(#hatchBooked)" />
          <circle cx="582" cy="285" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="582" y="289" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">9</text>
          <text x="582" y="302" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">140.01</text>
          <text x="582" y="274" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">37'-3"</text>
          <text x="582" y="312" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">33'-8"</text>
        </g>

        {/* Plot 8 (Right Wing Upper) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-08')}>
          <polygon points="545,198 625,200 620,258 545,255" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="545,198 625,200 620,258 545,255" fill="url(#hatchBooked)" />
          <circle cx="582" cy="226" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="582" y="230" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">8</text>
          <text x="582" y="242" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">127.25</text>
          <text x="582" y="214" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">34'-2"</text>
          <text x="635" y="240" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155" transform="rotate(-90 635 240)">21'-8"</text>
        </g>

        {/* Plot 7 (Right Wing Top) */}
        <g className="cursor-pointer" onClick={() => onSelectPlot?.('P-07')}>
          <polygon points="545,150 635,148 625,200 545,198" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="545,150 635,148 625,200 545,198" fill="url(#hatchBooked)" />
          <circle cx="585" cy="174" r="11" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
          <text x="585" y="178" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0f172a">7</text>
          <text x="585" y="188" fontSize="8" fontWeight="700" textAnchor="middle" fill="#475569">127.25</text>
          <text x="585" y="162" fontSize="8" fontWeight="600" textAnchor="middle" fill="#334155">37'-8"</text>
        </g>

        {/* ── 13ft WIDE ROAD (L-Shaped Dark Asphalt Pathway) ── */}
        <path
          d="M 230,150 L 615,145 L 610,185 L 530,185 L 515,395 L 485,395 L 500,185 L 230,175 Z"
          fill="#334155"
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        {/* Road Label */}
        <text
          x="360"
          y="166"
          fontFamily="system-ui, sans-serif"
          fontSize="12"
          fontWeight="800"
          fill="#ffffff"
          letterSpacing="1"
        >
          13ft WIDE ROAD - - - - - - - -
        </text>
        <text
          x="500"
          y="290"
          fontFamily="system-ui, sans-serif"
          fontSize="10"
          fontWeight="800"
          fill="#ffffff"
          transform="rotate(90 500 290)"
          letterSpacing="1"
        >
          13ft ROAD
        </text>
      </svg>
    </div>
  );
};
