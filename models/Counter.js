import mongoose from "mongoose";

/* A simple named counter, e.g. { _id: "intermediary", seq: 7 }.
   Incremented atomically so reference numbers are always sequential
   and never collide, even under concurrent submissions. */
const CounterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

delete mongoose.models.Counter;
export default mongoose.model("Counter", CounterSchema);