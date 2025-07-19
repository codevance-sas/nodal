import { FC } from 'react';

/**
 * Panel de configuración del pozo que permite al usuario establecer
 * los parámetros básicos del diseño del pozo
 */
export const WellboreConfigPanel: FC = () => (
  <div className="space-y-6">
    {/* Wellbore Type */}
    <div className="space-y-3">
      <label className="text-subheadline font-medium text-foreground">
        Wellbore Type
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-tinted h-10 px-4 text-callout">Vertical</button>
        <button className="btn-filled h-10 px-4 text-callout">
          Horizontal
        </button>
      </div>
    </div>

    {/* TVD */}
    <div className="space-y-3">
      <label className="text-subheadline font-medium text-foreground">
        TVD (ft)
      </label>
      <input className="input-apple" placeholder="8000" />
    </div>

    {/* Horizontal Reach */}
    <div className="space-y-3">
      <label className="text-subheadline font-medium text-foreground">
        Horizontal Reach (ft)
      </label>
      <input className="input-apple" placeholder="1500" />
    </div>

    {/* Temperature */}
    <div className="space-y-4">
      <h3 className="text-subheadline font-medium text-foreground">
        Temperature Profile
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-footnote text-muted-foreground">
            Surface Temperature (°F)
          </label>
          <input className="input-apple mt-1" placeholder="75" />
        </div>
        <div>
          <label className="text-footnote text-muted-foreground">
            Gradient (°F/100ft)
          </label>
          <input className="input-apple mt-1" placeholder="1.5" />
        </div>
      </div>
    </div>
  </div>
);
