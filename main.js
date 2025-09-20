const main_canvas = document.querySelector("#main_canvas");
const back_canvas = document.querySelector("#back_canvas");
const graph_canvas = document.querySelector("#graph_canvas");
const graph_ball_canvas = document.querySelector("#graph_ball_canvas");

const pendulums_div = document.querySelector("#pendulums_div");

const pause_button = document.querySelector("#pause_button");
const simulate_button = document.querySelector("#simulate_button");
const add_button = document.querySelector("#add_button");
const path_button = document.querySelector("#path_button");

let pendulums = [];

const ctx = main_canvas.getContext("2d");
const back_ctx = back_canvas.getContext("2d")
const graph_ctx = graph_canvas.getContext("2d")
const graph_ball_ctx = graph_ball_canvas.getContext("2d")

const width = window.innerWidth * 3 / 4;
const height = window.innerHeight;

const middle_x = width / 2;
const middle_y = height / 2;

let paused = false;

const dt = 1 / 1200;
const physics_runs_per_canvas_update = 10;
let prpcu_counter = 0;

const pixels_p_meter = 150;

let last_time = performance.now()

main_canvas.width = width;
main_canvas.height = height;

back_canvas.width = width;
back_canvas.height = height;

const graph_width = width * 4 / 3 - 64;
const graph_height = height;

graph_canvas.width = graph_width;
graph_canvas.height = graph_height;
graph_ctx.lineWidth = 0.5;

graph_ball_canvas.width = graph_width;
graph_ball_canvas.height = graph_height;


function toggle_path() {
    back_canvas.classList.toggle("hidden");
}
path_button.onclick = () => { toggle_path() };

function pause(stay_paused = false, r = false) {
    if (stay_paused) {
        paused = true
    } else {
        paused = !paused;
    }

    if (paused) {
        pause_button.textContent = "▷";
    } else {
        pause_button.textContent = "❚❚";
    }

    if (r) {
        restart(false);
    }
}

pause_button.onclick = () => { pause() };

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.round(Math.random() * 16)];
    }
    return color;
}

function toggle_hide_div(child) {
    hide_div = child.parentNode.parentNode.parentNode.querySelector("#hide_div");
    if (hide_div.classList.contains("hidden")) {
        hide_div.className = "flex flex-col gap-4"
        child.textContent = "▾"
    } else {
        hide_div.className = "hidden"
        child.textContent = "▴"
    }
}

function new_pendulum() {
    const container = document.createElement("div");
    container.className = "bg-white rounded-lg p-2 w-full flex flex-col gap-4";

    const header = document.createElement("div");
    header.className = "flex justify-between items-center";

    const smallerContainer = document.createElement("div");
    smallerContainer.className = "flex gap-4";

    const collapseButton = document.createElement("button");
    collapseButton.id = "collapse_button"
    collapseButton.textContent = "▴";
    collapseButton.className = "text-md sm:text-lg md:text-xl";

    const title = document.createElement("h3");
    title.className = "text-md sm:text-lg md:text-xl";
    title.textContent = `#${pendulums_div.childElementCount + 1}`;

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = getRandomColor();
    colorInput.id = "color_input";

    smallerContainer.appendChild(collapseButton);
    smallerContainer.appendChild(title);
    header.appendChild(smallerContainer);
    header.appendChild(colorInput);
    container.appendChild(header);

    const hide_div = document.createElement("div");
    hide_div.id = "hide_div";
    hide_div.className = "hidden";

    const hr = document.createElement("hr");
    hr.className = "bg-black h-0.5 w-full mb-4";
    hide_div.appendChild(hr);

    function createRow(labelText, inputType, inputAttributes = {}) {
        const row = document.createElement("div");
        row.className = "flex justify-between items-center w-full gap-4";

        const label = document.createElement("h4");
        label.textContent = labelText;

        const input = document.createElement("input");
        input.type = inputType;

        let num_input = null;

        if (inputType == "range") {
            num_input = document.createElement("input");
            num_input.className = "w-16 px-1 rounded-lg border-2";
            num_input.type = "number";
            num_input.step = "0.1";
            if (inputAttributes["id"] == "a1_input") {
                num_input.id = "a1_num_input";
            } else {
                num_input.id = "a2_num_input";
            }
            num_input.step = "0.1";
            num_input.value = inputAttributes["value"];
        }

        for (const attr in inputAttributes) {
            input.setAttribute(attr, inputAttributes[attr]);
        }

        row.appendChild(label);
        row.appendChild(input);
        if (num_input) { row.appendChild(num_input); }
        return row;
    }

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete Pendulum";
    deleteButton.className = "text-md sm:text-lg md:text-xl bg-red-500 w-full text-white p-2 rounded-lg";
    deleteButton.id = "delete_button";

    // Add rows
    hide_div.appendChild(createRow("Θ₁ (Rad)", "range", { min: 0, max: 6.28318530718, step: "any", id: "a1_input", value: Math.random() * 2 * Math.PI }));
    hide_div.appendChild(createRow("Θ₂ (Rad)", "range", { min: 0, max: 6.28318530718, step: "any", id: "a2_input", value: Math.random() * 2 * Math.PI }));

    hide_div.appendChild(createRow("M₁ (Kg)", "number", { min: 0, class: "rounded-md border-2", value: 15, id: "m1_input" }));
    hide_div.appendChild(createRow("M₂ (Kg)", "number", { min: 0, class: "rounded-md border-2", value: 5, id: "m2_input" }));

    hide_div.appendChild(createRow("L₁ (Metros)", "number", { min: 0, class: "rounded-md border-2", value: 1, id: "l1_input", step: 0.1 }));
    hide_div.appendChild(createRow("L₂ (Metros)", "number", { min: 0, class: "rounded-md border-2", value: 0.5, id: "l2_input", step: 0.1 }));

    hide_div.appendChild(createRow("ω₁ (Rad/s)", "number", { min: 0, class: "rounded-md border-2", value: 0, id: "v1_input" }));
    hide_div.appendChild(createRow("ω₂ (Rad/s)", "number", { min: 0, class: "rounded-md border-2", value: 0, id: "v2_input" }));

    hide_div.appendChild(deleteButton);

    container.appendChild(hide_div)

    pendulums_div.appendChild(container);

    restart(false);
}

add_button.onclick = () => new_pendulum();

function delete_pendulum(child) {
    const parent = child.parentNode.parentNode;
    const index = Array.from(pendulums_div.children).indexOf(parent);
    pendulums.splice(index, 1);
    parent.remove();
    restart(false);
}

function change_value_to_other_input_value(input_to_take_value, input_to_put_value, min, max) {
    let value = input_to_take_value.value;
    if (value < min) {
        value = value % max;
        if (value < 0) {
            value = max + value;
        }
        input_to_take_value.value = value;
    } else if (value > max) {
        value = max;
        input_to_take_value.value = value;
    }
    input_to_put_value.value = value;
}

function restart(depause = true) {
    back_ctx.clearRect(0, 0, width, height);
    graph_ctx.clearRect(0, 0, graph_width, graph_height);
    graph_ball_ctx.clearRect(0, 0, graph_width, graph_height);

    if (depause) {
        paused = false;
        pause_button.textContent = "❚❚";
    } else {
        pause(true);
    }
    pendulums = [];

    for (let pendulum of pendulums_div.children) {
        const a1_input = pendulum.querySelector("#a1_input");
        const a2_input = pendulum.querySelector("#a2_input");
        const a1_num_input = pendulum.querySelector("#a1_num_input");
        const a2_num_input = pendulum.querySelector("#a2_num_input");
        const m1_input = pendulum.querySelector("#m1_input");
        const m2_input = pendulum.querySelector("#m2_input");
        const l1_input = pendulum.querySelector("#l1_input");
        const l2_input = pendulum.querySelector("#l2_input");
        const v1_input = pendulum.querySelector("#v1_input");
        const v2_input = pendulum.querySelector("#v2_input");
        const color_input = pendulum.querySelector("#color_input");
        const delete_button = pendulum.querySelector("#delete_button");
        const collapse_button = pendulum.querySelector("#collapse_button");

        a1_input.oninput = () => {
            change_value_to_other_input_value(a1_input, a1_num_input, 0, 6.28318530718);
            pause(true, true);
        };
        a2_input.oninput = () => {
            change_value_to_other_input_value(a2_input, a2_num_input, 0, 6.28318530718);
            pause(true, true);
        };
        a1_num_input.oninput = () => {
            change_value_to_other_input_value(a1_num_input, a1_input, 0, 6.28318530718)
            pause(true, true);
        };
        a2_num_input.oninput = () => {
            change_value_to_other_input_value(a2_num_input, a2_input, 0, 6.28318530718)
            pause(true, true);
        };
        m1_input.oninput = () => pause(true, true);
        m2_input.oninput = () => pause(true, true);
        l1_input.oninput = () => pause(true, true);
        l2_input.oninput = () => pause(true, true);
        v1_input.oninput = () => pause(true, true);
        v2_input.oninput = () => pause(true, true);
        color_input.oninput = () => pause(true, true);
        delete_button.onclick = () => delete_pendulum(delete_button);
        collapse_button.onclick = () => toggle_hide_div(collapse_button);

        theta1 = parseFloat(a1_input.value);
        theta2 = parseFloat(a2_input.value);
        m1 = parseFloat(m1_input.value);
        m2 = parseFloat(m2_input.value);
        l1 = parseFloat(l1_input.value);
        l2 = parseFloat(l2_input.value);
        v1 = parseFloat(v1_input.value);
        v2 = parseFloat(v2_input.value);
        color = color_input.value;

        pendulums.push([theta1, theta2, m1, m2, l1, l2, v1, v2, color]);
    }
}

simulate_button.onclick = () => restart();

function update_variables() {
    for (let pendulum of pendulums) {
        theta1 = pendulum[0];
        theta2 = pendulum[1];
        m1 = pendulum[2];
        m2 = pendulum[3];
        l1 = pendulum[4];
        l2 = pendulum[5];
        v1 = pendulum[6];
        v2 = pendulum[7];

        let a1 = (- 9.81 * (2 * m1 + m2) * Math.sin(theta1) - m2 * 9.81 * Math.sin(theta1 - 2 * theta2) - 2 * Math.sin(theta1 - theta2) * m2 * (v2 ** 2 * l2 + v1 ** 2 * l1 * Math.cos(theta1 - theta2))) / (l1 * (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2)));
        let a2 = 2 * Math.sin(theta1 - theta2) * (v1 ** 2 * l1 * (m1 + m2) + 9.81 * (m1 + m2) * Math.cos(theta1) + v2 ** 2 * l2 * m2 * Math.cos(theta1 - theta2)) / (l2 * (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2)))

        v1 += a1 * dt;
        v2 += a2 * dt;

        theta1 += v1 * dt;
        theta2 += v2 * dt;

        pendulum[0] = theta1;
        pendulum[1] = theta2;
        pendulum[6] = v1;
        pendulum[7] = v2;
    }

}

function draw(pendulum) {
    ctx.fillStyle = pendulum[8];
    back_ctx.strokeStyle = pendulum[8];
    graph_ctx.strokeStyle = pendulum[8];

    theta1 = pendulum[0];
    theta2 = pendulum[1];
    l1 = pendulum[4];
    l2 = pendulum[5];
    m1 = pendulum[2];
    m2 = pendulum[3];
    lx = pendulum[9];
    ly = pendulum[10];
    ltx = pendulum[11];
    lty = pendulum[12];

    ctx.beginPath();
    let x1 = middle_x + l1 * Math.sin(theta1) * pixels_p_meter;
    let y1 = middle_y + l1 * Math.cos(theta1) * pixels_p_meter;
    ctx.moveTo(middle_x, middle_y)
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.beginPath();
    let x2 = middle_x + l1 * Math.sin(theta1) * pixels_p_meter + l2 * Math.sin(theta2) * pixels_p_meter
    let y2 = middle_y + l1 * Math.cos(theta1) * pixels_p_meter + l2 * Math.cos(theta2) * pixels_p_meter

    pendulum[9] = x2;
    pendulum[10] = y2;

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke()

    if (lx !== undefined && ly !== undefined) {
        back_ctx.beginPath();
        back_ctx.moveTo(lx, ly);
        back_ctx.lineTo(x2, y2);
        back_ctx.stroke();
    }


    ctx.beginPath();
    const radius1 = (((3 * m1) / (31200 * Math.PI)) ** (1 / 3)) * pixels_p_meter; // considering the density of steel
    ctx.arc(x1, y1, radius1, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fill();

    ctx.beginPath()
    const radius2 = (((3 * m2) / (31200 * Math.PI)) ** (1 / 3)) * pixels_p_meter; // considering the density of steel
    ctx.arc(x2, y2, radius2, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fill();

    function normalizeTheta(theta) {
        return ((theta + Math.PI) % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI) - Math.PI;
    }


    let theta1n = normalizeTheta(theta1);
    let theta2n = normalizeTheta(theta2);

    let x = graph_width / 2 + (theta1n / Math.PI) * (graph_width / 2);
    let y = graph_height / 2 + (theta2n / Math.PI) * (graph_height / 2);

    pendulum[11] = x;
    pendulum[12] = y;

    if (ltx !== undefined && lty !== undefined && Math.abs(ltx - x) < graph_width / 2 && Math.abs(lty - y) < graph_height / 2) {
        graph_ctx.beginPath();
        graph_ctx.moveTo(ltx, lty);
        graph_ctx.lineTo(x, y);
        graph_ctx.stroke();
    }


    graph_ball_ctx.beginPath();
    graph_ball_ctx.arc(x, y, 5, 0, 2 * Math.PI);
    graph_ball_ctx.fill();
    graph_ball_ctx.stroke();
}

function animate(timestamp) {
    if (!paused) {
        let elapsed = (timestamp - last_time) / 1000;
        last_time = timestamp;

        let steps = Math.floor(elapsed / dt);
        if (steps > 100) steps = 100;
        for (let i = 0; i < steps; i++) {
            update_variables();
        }

    } else {
        last_time = timestamp;
    }

    ctx.clearRect(0, 0, width, height);
    graph_ball_ctx.clearRect(0, 0, graph_width, graph_height);
    for (let pendulum of pendulums) {
        draw(pendulum);
    }
    requestAnimationFrame(animate);
}

restart()
requestAnimationFrame(animate);