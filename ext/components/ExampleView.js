// ext/components/ExampleView.js
export class ExampleView {
  constructor(container) {
    this.container = container;
  }

  render(examples, mode = "column") {
    this.container.className = `example-view ${mode}`;
    this.container.innerHTML = examples.map(ex => `<div class='example-item'>${ex}</div>`).join("");
    this.adjustFont();
  }

  adjustFont() {
    const items = this.container.querySelectorAll(".example-item");
    if (!items.length) return;
    const maxHeight = this.container.clientHeight || window.innerHeight * 0.7;
    const fontSize = Math.max(24, Math.min(90, maxHeight / (items.length + 2)));
    items.forEach(i => (i.style.fontSize = fontSize + "px"));
  }
}