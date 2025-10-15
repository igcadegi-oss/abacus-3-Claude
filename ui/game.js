import { createScreenShell, createButton, createStepIndicator } from "./helper.js";
import { setResults } from "../core/state.js";

export function renderGame(container, { t, navigate }) {
  const { section, body, heading, paragraph } = createScreenShell({
    title: t("game.title"),
    description: t("game.description"),
    className: "game-screen"
  });

  const indicator = createStepIndicator("game", t);
  section.insertBefore(indicator, section.firstChild);

  heading.textContent = t("game.title");
  paragraph.textContent = t("game.description");

  const helperCard = document.createElement("div");
  helperCard.className = "helper-card";

  const helperText = document.createElement("p");
  helperText.className = "helper-card__text";
  helperText.textContent = t("game.helper");
  helperCard.appendChild(helperText);

  const finishButton = createButton({
    label: t("game.cta"),
    onClick: () => {
      const totalAttempts = 10;
      const success = Math.floor(Math.random() * (totalAttempts + 1));
      setResults({ success, total: totalAttempts });
      navigate("results");
    }
  });

  finishButton.classList.add("btn--fullwidth");

  const actions = document.createElement("div");
  actions.className = "form__actions form__actions--stack";

  const backButton = createButton({
    label: t("buttons.back"),
    variant: "secondary",
    onClick: () => navigate("confirmation")
  });

  actions.append(backButton, finishButton);

  body.append(helperCard, actions);
  container.appendChild(section);
}