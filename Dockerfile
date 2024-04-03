FROM node:14

WORKDIR /app

COPY package.json .




RUN npm install -f && npm install typescript@4.5.2


# RUN npm run build

COPY . .



EXPOSE 3000

 #CMD ["node","index.js"]
CMD ["npm", "run", "start"]
# CMD [ "node", "index.js" ]
# CMD node index.js
