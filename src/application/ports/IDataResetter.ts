export interface IDataResetter {
  /** Descarta los datos modificados y vuelve a los datos simulados iniciales. */
  resetSimulatedData(): Promise<void>;
}
