const services = [
  {
    name: "Auth API",
    url: "https://jsonplaceholder.typicode.com/posts/1",
    interval: 10000,
    threshold: 500
  },
  {
    name: "User Service",
    url: "https://jsonplaceholder.typicode.com/users/1",
    interval: 15000,
    threshold: 800
  },
  {
    name: "Posts API",
    url: "https://jsonplaceholder.typicode.com/posts",
    interval: 20000,
    threshold: 1000  
  }
]

export default services