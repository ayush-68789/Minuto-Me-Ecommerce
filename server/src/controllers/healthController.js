// Owner: Member 1 — MVC controller returns JSON from the health model.
import healthModel from '../models/healthModel.js';

export function getHealth(_req, res) {
  res.status(200).json(healthModel.overall());
}

export function getLiveness(_req, res) {
  res.status(200).json(healthModel.liveness());
}

export function getReadiness(_req, res) {
  res.status(200).json(healthModel.readiness());
}

