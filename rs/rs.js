/*
 * 2022 Tarpeeksi Hyvae Soft
 *
 * Software: rs
 * 
 */

import mutations from "./mutations.js";

console.assert = function(condition, errorMessage = "") {
    if (!condition) {
        throw new Error(errorMessage);
    }
}

const controlPanelEl = document.querySelector("#control-panel");
console.assert(controlPanelEl);

const frameEl = document.querySelector("#rs-iframe");
console.assert(frameEl);

frameEl.src = rs_dosbox_url();

for (const [title, mutation] of Object.entries(mutations)) {
    console.assert(
        (typeof mutation === "object") &&
        (typeof mutation.id === "string") &&
        (typeof mutation.author === "string") &&
        Array.isArray(mutation.payload)
    );

    const checkboxEl = document.createElement("input");
    checkboxEl.setAttribute("type", "checkbox");
    checkboxEl.setAttribute("value", mutation.payload);
    checkboxEl.onchange = on_selection_changed;

    const labelEl = document.createElement("label");
    labelEl.setAttribute("class", "mutation");
    labelEl.append(checkboxEl, document.createTextNode(title));

    controlPanelEl.append(labelEl);
}

function on_selection_changed() {
    const selectedMutations = Array.from(controlPanelEl.querySelectorAll("input[type='checkbox']:checked"));
    const combinedMutationCommands = selectedMutations.map(m=>`'${m.value}'`);
    frameEl.focus();
    frameEl.src = rs_dosbox_url(combinedMutationCommands.join(","));
}

function rs_dosbox_url(extraCommands = "") {
    console.assert(typeof extraCommands == "string");
    return `http://localhost:8000/dosbox/?run=[${extraCommands},'rally.bat']#/rally-sport/rs/`;
}