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

const mutationContainerEl = controlPanelEl.querySelector("#mutation-container");
console.assert(mutationContainerEl);

const searchEl = controlPanelEl.querySelector("#search");
console.assert(searchEl);

const frameEl = document.querySelector("#rs-iframe");
console.assert(frameEl);

searchEl.oninput = (event)=>update_mutation_search(event.target.value);
frameEl.src = rs_dosbox_url();

for (const [title, mutation] of Object.entries(mutations).sort()) {
    console.assert(
        (typeof mutation === "object") &&
        (typeof mutation.id === "string") &&
        (typeof mutation.author === "string") &&
        Array.isArray(mutation.payload)
    );

    const checkboxEl = document.createElement("input");
    checkboxEl.setAttribute("type", "checkbox");
    checkboxEl.setAttribute("value", mutation.payload.map(element=>`'${element}'`));
    checkboxEl.dataset.mutationId = mutation.id;
    checkboxEl.onchange = on_selection_changed;

    const labelEl = document.createElement("label");
    labelEl.setAttribute("class", "mutation");
    labelEl.setAttribute("title", mutation.tooltip || "");
    labelEl.append(checkboxEl, document.createTextNode(title));

    mutationContainerEl.append(labelEl);
}

// Restore persistent selection of mutations, if any.
{
    const persistentSelection = localStorage.getItem("rs:mutation-selection").split(",");
    if (persistentSelection.length) {
        const mutationEls = Array.from(controlPanelEl.querySelectorAll("input[type='checkbox']"));
        mutationEls.filter(el=>persistentSelection.includes(el.dataset.mutationId)).forEach(el=>{el.checked = true; el.onchange()});
    }
}

function on_selection_changed() {
    const selectedMutations = Array.from(controlPanelEl.querySelectorAll("input[type='checkbox']:checked"));
    update_iframe_src(rs_dosbox_url(selectedMutations.map(m=>m.value)));
    localStorage.setItem("rs:mutation-selection", selectedMutations.map(el=>el.dataset.mutationId).join(","));
}

function rs_dosbox_url(commands = []) {
    console.assert(Array.isArray(commands));
    commands.push("'rally.bat'");
    return `http://localhost:8000/dosbox/?run=[${commands.join(",")}]#/rally-sport/rs/`;
}

function update_iframe_src(newUrl = "") {
    console.assert(typeof newUrl === "string");

    if (update_iframe_src.debounce !== undefined) {
        clearTimeout(update_iframe_src.debounce);
    }

    update_iframe_src.debounce = setTimeout(()=>{
        frameEl.focus();
        frameEl.src = newUrl;
        update_iframe_src.debounce = undefined;
    }, 500);
}

function update_mutation_search(query = "") {
    console.assert(typeof query === "string");
    query = query.trim().toLowerCase();
    const mutationEls = Array.from(controlPanelEl.querySelectorAll("input[type='checkbox']")).map(el=>el.parentElement);
    const matchingMutationEls = mutationEls.filter(el=>el.textContent.toLowerCase().includes(query));
    mutationEls.forEach(el=>el.style.display = "none");
    matchingMutationEls.forEach(el=>el.style.display = "block");
    mutationContainerEl.classList[matchingMutationEls.length? "remove" : "add"]("empty");
}
