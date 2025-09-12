#!/bin/bash

case "$1" in
    start)
        echo "🚀 Starting bot..."
        pm2 start ecosystem.config.js
        ;;
    stop)
        echo "⏹️ Stopping bot..."
        pm2 stop telegram-bot
        ;;
    restart)
        echo "🔄 Restarting bot..."
        pm2 restart telegram-bot
        ;;
    status)
        echo "📊 Bot status:"
        pm2 status
        ;;
    logs)
        echo "📱 Bot logs:"
        pm2 logs telegram-bot
        ;;
    monit)
        echo "📊 Monitoring bot..."
        pm2 monit
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|monit}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the bot"
        echo "  stop    - Stop the bot"
        echo "  restart - Restart the bot"
        echo "  status  - Show bot status"
        echo "  logs    - Show bot logs"
        echo "  monit   - Monitor bot resources"
        exit 1
        ;;
esac
