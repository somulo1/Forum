
const api = 'http://localhost:8080/api'; 


const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');

if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const form = e.target; 
        const formData = new FormData(form);  

        const avatarFile = form.avatar.files[0];
        formData.append('avatar_url', avatarFile || '');

        const result = await registerUser(formData);

        if (!result.error) {
            showMessage("#message", result.message);
        } else {
            showMessage("#message", result.error, true);
        }
    });
}


if (loginForm){
        loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const form = e.target; 
        const formData = new FormData(form); 

        const result = await loginUser(formData);

        if (!result.error) {
            showMessage("#message", result.message);
        } else {
            showMessage("#message", result.error, true);
        }       

    });
}



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

async function loginUser(formData) {
    const jsonObject = {};
    formData.forEach((value, key) => {
        jsonObject[key] = value;
    });

    try {

        const response = await fetch(api+'/login', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(jsonObject),
        });

        const result = await response.text();
        console.log(result);

        if (!response.ok) {
            throw new Error(result.error);
        }

        console.log(result.message);

        return result;
        
    } catch (error) {
        console.log('Error registering user: ', error);
        return {error: error.message || 'Something went wrong'};
    }
}

function showMessage(selector, message, isError = false) {
    const el = document.querySelector(selector);
    el.style.color = isError ? "red" : "green";
    el.style.display = "block";
    el.textContent = message;
    setTimeout(() => el.style.display = "none", 5000);
}
