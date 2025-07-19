import { BhaRowData } from '@/core/nodal-modules/wellbore-design/types/bha-builder.type';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Zustand store for managing BHA rows globally.
 */
interface BhaStore {
  bhaRows: BhaRowData[];
  setBhaRows: (rows: BhaRowData[]) => void;

  casingRows: BhaRowData[];
  setCasingRows: (rows: BhaRowData[]) => void;

  initialTop: number;
  setInitialTop: (top: number) => void;

  addBhaRow: (row: BhaRowData) => void;
  removeBhaRow: (id: string) => void;

  addCasingRow: (row: BhaRowData) => void;
  removeCasingRow: (id: string) => void;

  nodalDepth: number;
  setNodalDepth: (depth: number) => void;

  averageTubingJoints: number;
  setAverageTubingJoints: (depth: number) => void;
}

export const useBhaStore = create<BhaStore>()(
  devtools(
    set => ({
      bhaRows: [],
      setBhaRows: rows => set({ bhaRows: rows }),
      casingRows: [],
      setCasingRows: rows => set({ casingRows: rows }),
      initialTop: 0,
      setInitialTop: top =>
        set(state => {
          const newTop = top >= 0 ? top : 0;
          return {
            initialTop: newTop,
            nodalDepth: state.nodalDepth < newTop ? newTop : state.nodalDepth,
          };
        }),
      addBhaRow: row => set(state => ({ bhaRows: [...state.bhaRows, row] })),
      removeBhaRow: id =>
        set(state => ({
          bhaRows: state.bhaRows.filter(row => row.id !== id),
        })),
      addCasingRow: row =>
        set(state => ({ casingRows: [...state.casingRows, row] })),
      removeCasingRow: id =>
        set(state => ({
          casingRows: state.casingRows.filter(row => row.id !== id),
        })),
      nodalDepth: 0,
      setNodalDepth: depth =>
        set(state => {
          const validDepth = Math.max(depth, state.initialTop);
          return { nodalDepth: validDepth };
        }),
      averageTubingJoints: 0,
      setAverageTubingJoints: joints =>
        set(() => {
          const validJoints = Math.max(joints, 0);
          return { averageTubingJoints: validJoints };
        }),
    }),
    { name: 'BhaStore' }
  )
);
