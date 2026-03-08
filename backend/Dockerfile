FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build NestJS
RUN npm run build

# HTB: Add flowuser for lateral movement
RUN adduser -D -s /bin/sh flowuser
RUN echo "flowuser:Fl0wUs3r!" | chpasswd 2>/dev/null || true

# HTB: user.txt flag
RUN mkdir -p /home/flowuser && \
    echo "3f1d9c2a7e8b4f6d0a5c9b1e2d3f4a7b" > /home/flowuser/user.txt && \
    chown flowuser:flowuser /home/flowuser/user.txt && \
    chmod 644 /home/flowuser/user.txt

# HTB: Cron job vulnerable to PATH hijacking (privesc vector)
RUN echo "*/5 * * * * root PATH=/opt/scripts:\$PATH /opt/update-ai.sh" >> /etc/crontabs/root
RUN mkdir -p /opt/scripts && \
    echo '#!/bin/sh\npython3 /app/health_check.py' > /opt/update-ai.sh && \
    chmod +x /opt/update-ai.sh

EXPOSE 3000

CMD ["node", "dist/main"]
