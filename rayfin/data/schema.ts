import { PortCall } from './PortCall.js';
import { Vessel } from './Vessel.js';
import { VesselNote } from './VesselNote.js';

export type VesselWatchlistSchema = {
  Vessel: Vessel;
  PortCall: PortCall;
  VesselNote: VesselNote;
};

export const schema = [Vessel, PortCall, VesselNote];
