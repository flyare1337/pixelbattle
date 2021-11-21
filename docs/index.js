const hostname = "http://localhost:9000";
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
    $.ajax({
        url: `${hostname}/getInfo`,
        type: 'POST',
        data: { token: userToken },
        success: (data) => {
            if (data.error) return alert(processedErrors(data.reason));
            document.getElementById('user-id').innerText = data.userID;
        }
    });
}

$('#user-login').on('click', (event) => {
    event.preventDefault();
    let token = document.getElementById('user-token');
    if (!token || !token.value) return alert('Где токен?');
    localStorage.setItem('user-token', token.value);
    window.location.reload();
});

$('#user-logout').on('click', (event) => {
    event.preventDefault();
    localStorage.removeItem('user-token');
    window.location.reload();
});

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

$('.pix').on('click', (event) => {
    event.preventDefault();
    if (!userToken) return alert('Вы не авторизованы!');

    $.ajax({
        url: `${hostname}/pixels/upload`,
        type: 'POST',
        data: {
            id: Number(event.target.id.split("p_")[1]),
            color: localStorage.getItem('user-color'),
            token: userToken
        },
        success: (data) => {
            if (data.error) return alert(processedErrors(data.reason, [data.cooldown || 0]));
            document.getElementById(event.target.id).style = `background-color: ${localStorage.getItem('user-color')};`;
        }
    });
});

let ended;
function updatePic() {
    $.ajax({
        url: `${hostname}/pixels/get`,
        type: 'POST',
        success: (data) => {
            ended = data.ended;
            for (let x of data.pixels) {
                let pixel = document.getElementById(`p_${x.id}`);
                if (pixel) pixel.style = `background-color: ${x.color};`;
            }
        }
    });
}

updatePic();
setTimeout(() => {
    if (!ended) setInterval(() => { updatePic(); }, 2000);
    else document.getElementById('pixel-ended').style = '';
}, 1000);