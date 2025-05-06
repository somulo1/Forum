
const api = 'http://localhost:8080/api'

const userData = {
    username: "baraq",
    email: "b2araq123@gmail.com",
    password: "password",
    avatar_url: '',
}


async function regiterUser(userData) {
    try {
        const formData = new FormData();

        formData.append('username', userData.username);
        formData.append('email', userData.email);
        formData.append('password', userData.password);
        formData.append('avatar_url', userData.avatar_url);

        const response = await fetch(api+'/register', {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        return result;
        
    } catch (error) {
        console.log('Error registering user: ', error);
        return null;
    }
}

regiterUser(userData);