import React from "react";
export function Section(props) {
  return (<section className="section">
    <div className="container">{props.children}</div>
  </section>);
}
