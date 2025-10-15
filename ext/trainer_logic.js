// ext/trainer_logic.js
import { ExampleView } from "./components/ExampleView.js";
import { generateExamples } from "./core/generator.js";

export function mountTrainerUI(container, { t, state }) {
  container.innerHTML = "";
  const layout = document.createElement("div");
  layout.className = "trainer-layout";
  layout.innerHTML = `
    <div class="trainer-left">
      <div id="exampleView" class="example-view"></div>
      <div class="view-mode">
        <label><input type="radio" name="mode" value="column" checked> Столбик</label>
        <label><input type="radio" name="mode" value="inline"> Строка</label>
      </div>
    </div>
  `;
  container.appendChild(layout);

  const exampleContainer = layout.querySelector("#exampleView");
  const view = new ExampleView(exampleContainer);
  const examples = generateExamples(10);
  view.render(examples, "column");

  layout.querySelectorAll("input[name='mode']").forEach(radio => {
    radio.addEventListener("change", e => {
      view.render(examples, e.target.value);
    });
  });
}