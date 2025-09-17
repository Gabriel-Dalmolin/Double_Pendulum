const main_canvas = document.querySelector("#main_canvas");

const pendulums_div = document.querySelector("#pendulums_div");

const pause_button = document.querySelector("#pause_button");
const simulate_button = document.querySelector("#simulate_button");
const add_button = document.querySelector("#add_button");

let pendulums = [];

const ctx = main_canvas.getContext("2d");

const width = window.innerWidth * 3 / 4;
const height = window.innerHeight;

const middle_x = width / 2;
const middle_y = height / 2;

let paused = false;

const dt = 1 / 1200;
const physics_runs_per_canvas_update = 10;
let prpcu_counter = 0;

const pixels_p_meter = 200;

let last_time = performance.now()

main_canvas.width = width;
main_canvas.height = height;

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

function new_pendulum() {
    const container = document.createElement("div");
    container.className = "bg-white rounded-lg p-2 w-full flex flex-col gap-4";

    const header = document.createElement("div");
    header.className = "flex justify-between items-center";

    const title = document.createElement("h3");
    title.className = "text-md sm:text-lg md:text-xl";
    title.textContent = `#${pendulums_div.childElementCount + 1}`;

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = getRandomColor();
    colorInput.id = "color_input";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "X";
    deleteButton.className = "text-lg sm:text-xl md:text-3xl text-red-800";
    deleteButton.id = "delete_button";

    header.appendChild(title);
    header.appendChild(colorInput);
    header.appendChild(deleteButton);
    container.appendChild(header);

    const hr = document.createElement("hr");
    hr.className = "bg-black h-0.5 w-full mb-4";
    container.appendChild(hr);

    function createRow(labelText, inputType, inputAttributes = {}) {
        const row = document.createElement("div");
        row.className = "flex justify-between items-center w-full gap-4";

        const label = document.createElement("h4");
        label.textContent = labelText;

        const input = document.createElement("input");
        input.type = inputType;

        for (const attr in inputAttributes) {
            input.setAttribute(attr, inputAttributes[attr]);
        }

        row.appendChild(label);
        row.appendChild(input);
        return row;
    }

    // Add rows
    container.appendChild(createRow("Θ₁ (Radianos)", "range", { min: 0, max: 6.28318530718, step: "any", id: "a1_input", value: Math.random() * 2 * Math.PI }));
    container.appendChild(createRow("Θ₂ (Radianos)", "range", { min: 0, max: 6.28318530718, step: "any", id: "a2_input", value: Math.random() * 2 * Math.PI }));

    container.appendChild(createRow("M₁ (Kg)", "number", { min: 0, class: "rounded-md border-2", value: 15, id: "m1_input" }));
    container.appendChild(createRow("M₂ (Kg)", "number", { min: 0, class: "rounded-md border-2", value: 5, id: "m2_input" }));

    container.appendChild(createRow("L₁ (Metros)", "number", { min: 0, class: "rounded-md border-2", value: 1, id: "l1_input", step: 0.1 }));
    container.appendChild(createRow("L₂ (Metros)", "number", { min: 0, class: "rounded-md border-2", value: 0.5, id: "l2_input", step: 0.1 }));

    container.appendChild(createRow("ω₁ (Rad/s)", "number", { min: 0, class: "rounded-md border-2", value: 0, id: "v1_input" }));
    container.appendChild(createRow("ω₂ (Rad/s)", "number", { min: 0, class: "rounded-md border-2", value: 0, id: "v2_input" }));

    pendulums_div.appendChild(container);

    restart(false);
}

add_button.onclick = () => new_pendulum();

function delete_pendulum(child) {
    const parent = child.parentNode.parentNode;
    const index = Array.from(pendulums_div.children).indexOf(parent);
    pendulums.splice(index, 1);
    parent.remove();
}

function restart(depause = true) {
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
        const m1_input = pendulum.querySelector("#m1_input");
        const m2_input = pendulum.querySelector("#m2_input");
        const l1_input = pendulum.querySelector("#l1_input");
        const l2_input = pendulum.querySelector("#l2_input");
        const v1_input = pendulum.querySelector("#v1_input");
        const v2_input = pendulum.querySelector("#v2_input");
        const color_input = pendulum.querySelector("#color_input");
        const delete_button = pendulum.querySelector("#delete_button");

        a1_input.oninput = () => pause(true, true);
        a2_input.oninput = () => pause(true, true);
        m1_input.oninput = () => pause(true, true);
        m2_input.oninput = () => pause(true, true);
        l1_input.oninput = () => pause(true, true);
        l2_input.oninput = () => pause(true, true);
        v1_input.oninput = () => pause(true, true);
        v2_input.oninput = () => pause(true, true);
        color_input.oninput = () => pause(true, true);
        delete_button.onclick = () => delete_pendulum(delete_button);

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

        pendulum[6] += (- 9.81 * (2 * m1 + m2) * Math.sin(theta1) - m2 * 9.81 * Math.sin(theta1 - 2 * theta2) - 2 * Math.sin(theta1 - theta2) * m2 * (v2 ** 2 * l2 + v1 ** 2 * l1 * Math.cos(theta1 - theta2))) / (l1 * (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2))) * dt;
        pendulum[0] += v1 * dt;

        pendulum[7] += 2 * Math.sin(theta1 - theta2) * (v1 ** 2 * l1 * (m1 + m2) + 9.81 * (m1 + m2) * Math.cos(theta1) + v2 ** 2 * l2 * m2 * Math.cos(theta1 - theta2)) / (l2 * (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2))) * dt;
        pendulum[1] += v2 * dt;
    }

}

function draw(pendulum) {
    ctx.fillStyle = pendulum[8];

    theta1 = pendulum[0];
    theta2 = pendulum[1];
    l1 = pendulum[4];
    l2 = pendulum[5];
    m1 = pendulum[2];
    m2 = pendulum[3];

    ctx.beginPath();
    let x1 = middle_x + l1 * Math.sin(theta1) * pixels_p_meter;
    let y1 = middle_y + l1 * Math.cos(theta1) * pixels_p_meter;
    ctx.moveTo(middle_x, middle_y)
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.beginPath();
    let x2 = middle_x + l1 * Math.sin(theta1) * pixels_p_meter + l2 * Math.sin(theta2) * pixels_p_meter
    let y2 = middle_y + l1 * Math.cos(theta1) * pixels_p_meter + l2 * Math.cos(theta2) * pixels_p_meter

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke()

    ctx.beginPath();
    const radius1 = (((3 * m1) / (31200 * Math.PI)) ** (1 / 3)) * pixels_p_meter; // considering the density of steel
    ctx.arc(x1, y1, radius1, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath()
    const radius2 = (((3 * m2) / (31200 * Math.PI)) ** (1 / 3)) * pixels_p_meter; // considering the density of steel
    ctx.arc(x2, y2, radius2, 0, 2 * Math.PI);
    ctx.fill()

    ctx.stroke()
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
    for (let pendulum of pendulums) {
        draw(pendulum);
    }
    requestAnimationFrame(animate);
}

restart()
requestAnimationFrame(animate);
