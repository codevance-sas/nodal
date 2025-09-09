import type {
  GenericAPIError,
  GenericErrorResponse,
  GenericServiceResponse,
  GenericActionResult,
} from '@/types/util.types';

// ==================== Results and Sections ====================

export type SectionAnalysisKey =
  | 'ipr'
  | 'pvt'
  | 'hydraulics'
  | 'results'
  | 'correlations'
  | 'sensitivity';

export interface AnalysisPoint {
  rate: number;
  pressure: number;
}

// ==================== ENDPOINTS AND API ====================

export type NodalAnalysisEndpoint =
  | 'calculate'
  | 'curves'
  | 'hydraulics'
  | 'recommend'
  | 'ipr';

export type APIError = GenericAPIError;

export type APIErrorResponse = GenericErrorResponse;

// ==================== IPR ====================

export interface IPRCalculationInput {
  BOPD: number;
  BWPD: number;
  MCFD: number;
  Pr: number;
  Pb: number;
  PIP: number;
  steps: number; // Default 25
}

export type IPRCalculationResponse = any;

// ==================== PVT ====================

export interface PVTCalculationInput {
  api: number;
  gas_gravity: number;
  gor: number;
  stock_temp?: number;
  stock_pressure?: number; // Default 14.7
  temperature: number;
  step_size?: number; // Default 25
  pb: number;
  co2_frac: number;
  h2s_frac: number;
  n2_frac: number;
  correlations: {
    additionalProp1?: string;
    additionalProp2?: string;
    additionalProp3?: string;
  };
  ift: number;
}

export type PVTCalculationResponse = any;
export type PVTCurveResponse = any;

// ==================== HYDRAULICS ====================

export interface GasLiftConfig {
  enabled: boolean;
  injection_depth: number;
  injection_volume_mcfd: number;
  injected_gas_gravity: number;
}

export interface HydraulicsInput {
  oil_rate: number;
  water_rate: number;
  gas_rate: number;
  reservoir_pressure: number;
  bubble_point: number;
  pump_intake_pressure: number;
  oil_gravity: number;
  gas_gravity: number;
  water_gravity: number;
  temperature: number;
  tubing_id: number;
  tubing_depth: number;
  casing_id: number;
  inclination: number;
  wellhead_pressure: number;
  temperature_gradient: number;
  roughness: number;
  gas_lift?: GasLiftConfig;
}

export interface PipeSegment {
  start_depth: number;
  end_depth: number;
  diameter: number;
}

export interface SurveyPoint {
  md: number;
  tvd: number;
  inclination: number;
}

export interface WellboreGeometry {
  pipe_segments: PipeSegment[];
  deviation: number;
  roughness: number; // Default 0.0006
  depth_steps: number; // Default 100
}

export interface FluidProperties {
  oil_rate: number;
  water_rate: number;
  gas_rate: number;
  oil_gravity: number;
  water_gravity: number; // Default 1
  gas_gravity: number;
  bubble_point: number;
  temperature_gradient: number;
  surface_temperature: number;
  wct: number;
  gor: number;
  glr: number;
}

export interface HydraulicsCalculationInput {
  fluid_properties: FluidProperties;
  wellbore_geometry: WellboreGeometry;
  method: string; // "hagedorn-brown"
  surface_pressure: number;
  bhp_mode: string; // "calculate"
  target_bhp: number;
  survey_data: SurveyPoint[];
}

export interface PressureProfilePoint {
  depth: number;
  pressure: number;
  temperature: number;
  flow_pattern: string; // "bubble"
  liquid_holdup: number;
  mixture_density: number;
  mixture_velocity: number;
  reynolds_number: number;
  friction_factor: number;
  dpdz_elevation: number;
  dpdz_friction: number;
  dpdz_acceleration: number;
  dpdz_total: number;
}

export interface FlowPatternPoint {
  depth: number;
  flow_pattern: string;
  liquid_holdup: number;
  mixture_velocity: number;
  superficial_liquid_velocity: number;
  superficial_gas_velocity: number;
}

export interface HydraulicsCalculationResponse {
  method: string;
  pressure_profile: PressureProfilePoint[];
  surface_pressure: number;
  bottomhole_pressure: number;
  overall_pressure_drop: number;
  elevation_drop_percentage: number;
  friction_drop_percentage: number;
  acceleration_drop_percentage: number;
  flow_patterns: FlowPatternPoint[];
}

export interface HydraulicsRecommendResponse {
  [key: string]: string;
}

// ==================== ALIASES ====================

export type ServiceResponse<T> = GenericServiceResponse<T>;

export type ActionResult<T> = GenericActionResult<T>;
