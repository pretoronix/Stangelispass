export interface NotificationTemplate {
  title: string;
  body: string;
  sound?: string;
  priority?: 'default' | 'normal' | 'high' | 'max';
  data?: Record<string, any>;
}

export const NotificationTemplates = {
  leaderChange: (userName: string, eventId?: string): NotificationTemplate => ({
    title: '👑 New Leader!',
    body: `${userName} just took the lead!`,
    sound: 'default',
    priority: 'high',
    data: {
      type: 'leader_change',
      eventId,
    },
  }),
  
  newRound: (eventName: string, eventId?: string): NotificationTemplate => ({
    title: '🍺 New Round Started',
    body: `${eventName} has begun! Time to drink!`,
    sound: 'default',
    priority: 'normal',
    data: {
      type: 'new_round',
      eventId,
    },
  }),
  
  milestone: (userName: string, count: number, eventId?: string): NotificationTemplate => ({
    title: '🎉 Milestone Reached!',
    body: `${userName} just hit ${count} beers!`,
    sound: 'default',
    priority: 'normal',
    data: {
      type: 'milestone',
      eventId,
      count,
    },
  }),
  
  newBadge: (badgeName: string): NotificationTemplate => ({
    title: '🏆 New Achievement!',
    body: `You unlocked: ${badgeName}`,
    sound: 'default',
    priority: 'high',
    data: {
      type: 'badge',
      badgeName,
    },
  }),

  roundExpiring: (eventName: string, hoursLeft: number, eventId?: string): NotificationTemplate => ({
    title: '⏰ Round Expiring Soon',
    body: `${eventName} expires in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}!`,
    sound: 'default',
    priority: 'normal',
    data: {
      type: 'round_expiring',
      eventId,
      hoursLeft,
    },
  }),
};
