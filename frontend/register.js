
const api = 'http://localhost:8080/api';

    

document.getElementById('signupForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = e.target; 
    const formData = new FormData(form);  

    const avatarFile = form.avatar.files[0];
    formData.append('avatar_url', avatarFile || '');

    const result = await registerUser(formData);

    if (result) {
        var res = document.querySelector("#message");
        res.style.display = "block";
        res.textContent = result.message;
        setTimeout(function () {
            res.style.display = "none";
        }, 5000);
    } else {
        var res = document.querySelector("#message");
        res.style.color = "red";
        res.style.display = "block";
        res.textContent = result.message;
        setTimeout(function () {
            res.style.display = "none";
        }, 5000);
    }

});


async function registerUser(formData) {
    try {

        const response = await fetch(api+'/register', {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        console.log(result.message)

        return result;
        
    } catch (error) {
        console.log('Error registering user: ', error);
        return {error: error.message || 'Something went wrong'};
    }
}

