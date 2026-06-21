const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcxOTU5NDMwMCwiZXhwIjoxNzE5NjAwMzAwfQ.xyz";
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
