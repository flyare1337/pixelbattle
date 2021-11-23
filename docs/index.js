const AREA_WIDTH = 80;
const AREA_HEIGHT = 50;
const hostname = "https://pixels-api.boticord.top";

const table = document.getElementById('pbarea');

let index = 0;

function updatePixel(id, color) {
    const pixelEl = document.getElementById(`p_${id + 1}`);
    pixelEl.style = `background-color: ${color};`;
}

for (let i = 0; i < AREA_HEIGHT; i++) {
    const row = table.insertRow(i);
    for (let j = 0; j < AREA_WIDTH; j++) {
        const cell = row.insertCell(j);

        const content = document.createElement('div');
        content.classList.add('pix');
        content.id = 'p_' + ++index;

        cell.appendChild(content);

        row.appendChild(cell);
    }
}

const processedErrors = (type, args) => {
    let types = {
        "IncorrectColor": "Указан некорректный код цвета.",
        "IncorrectPixel": "Нет такого пикселя.",
        "NotAuthorized": "Некорректная сессия!",
        "UserCooldown": `Подождите ${args[0]} секунд!`,
        "Ended": "Битва завершена"
    };

    return types[type];
};

let userToken = localStorage.getItem('user-token');
document.getElementById(`user-form-${userToken ? 'profile' : 'login'}`).style = '';
if (userToken) {
    fetch(`${hostname}/getInfo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: userToken })
    }).then(res => res.json()).then(x => {
        if (x.error) return alert(processedErrors(x.reason));
        document.getElementById('user-id').innerText = x.userID;
    }).catch(() => {});
}

document.getElementById('user-login').onclick = (e) => {
    e.preventDefault();
    let token = document.getElementById('user-token');
    if (!token || !token.value) return alert('Где токен?');
    localStorage.setItem('user-token', token.value);
    window.location.reload();
}

document.getElementById('user-logout').onclick = (e) => {
    e.preventDefault();
    localStorage.removeItem('user-token');
    window.location.reload();
}

if (!localStorage.getItem('user-color')) localStorage.setItem('user-color', '#FFFFFF');
document.getElementById('user-color').innerText = localStorage.getItem('user-color');
let check = ['#FFFFFF', '#000000', '#074BF3'].includes(localStorage.getItem('user-color'));
document.getElementById('user-color').style = `color: ${check ? "gold" : "black"}; background-color: ${localStorage.getItem('user-color')};`;

function changeColor(color) {
    localStorage.setItem('user-color', color);
    document.getElementById('user-color').innerText = localStorage.getItem('user-color');
    let check = ['#FFFFFF', '#000000', '#074BF3'].includes(localStorage.getItem('user-color'));
    document.getElementById('user-color').style = `color: ${check ? "gold" : "black"}; background-color: ${localStorage.getItem('user-color')};`;
}

[...document.getElementsByClassName('pix')].forEach(el => {
    el.addEventListener('click', e => {
        e.preventDefault();

        if (!userToken) return alert('Вы не авторизованы!');

        fetch(`${hostname}/pixels/put`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                id: Number(e.target.id.split("p_")[1] - 1),
                color: localStorage.getItem('user-color'),
                token: userToken
            })
        }).catch(() => {}).then(x => x.json()).catch(() => {}).then(x => {
            if (x.error) return alert(processedErrors(x.reason, [x.cooldown || 0]));
        })
    })
});

const eventSource = new EventSource(`${hostname}/pixels/sse`);
eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.op === 'PLACE') {
        updatePixel(data.id, data.color);
    }
}

eventSource.onopen = () => {
    fetch(`${hostname}/pixels/get`)
        .then(x => x.json())
        .then(({ pixels }) => {
            for (const pixel of pixels) {
                updatePixel(pixel.id, pixel.color);
            }
        });
}
