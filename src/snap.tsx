/** @jsxImportSource frog/jsx */
import { Frog } from "frog";

const snap = new Frog({
  basePath: "/snap",
});

snap.frame("/", (c) => {
  return c.res({
    image: (
      <div
        style={{
          background: "black",
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          fontSize: 48,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        🎬 YT SNAP READY
      </div>
    ),
    intents: [],
  });
});

export default snap;
