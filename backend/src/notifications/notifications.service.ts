import { Injectable, Logger } from '@nestjs/common';

type LeadNotification = {
  id: string;
  name: string;
  contact: string;
  status: string;
  budget?: string | number | null;
  purpose?: string | null;
  comment?: string | null;
};

type OrderNotification = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  totalPrice: string | number;
  customerName?: string | null;
  leadName?: string | null;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async notifyNewLead(lead: LeadNotification) {
    return this.send({
      subject: `Новая заявка #${lead.id}`,
      title: 'Поступила новая заявка',
      rows: [
        ['Имя', lead.name],
        ['Контакт', lead.contact],
        ['Бюджет', lead.budget ?? '—'],
        ['Назначение', lead.purpose ?? '—'],
        ['Комментарий', lead.comment ?? '—'],
        ['Статус', lead.status],
      ],
    });
  }

  async notifyLeadStatusChanged(input: {
    lead: LeadNotification;
    fromStatus: string;
    toStatus: string;
    comment?: string | null;
  }) {
    return this.send({
      subject: `Заявка #${input.lead.id}: статус изменён`,
      title: 'Изменён статус заявки',
      rows: [
        ['Имя', input.lead.name],
        ['Контакт', input.lead.contact],
        ['Было', input.fromStatus],
        ['Стало', input.toStatus],
        ['Комментарий', input.comment ?? '—'],
      ],
    });
  }

  async notifyOrderCreated(order: OrderNotification) {
    return this.send({
      subject: `Создан заказ ${order.number}`,
      title: 'Из заявки создан заказ',
      rows: [
        ['Номер заказа', order.number],
        ['Клиент', order.customerName ?? order.leadName ?? '—'],
        ['Сумма', order.totalPrice],
        ['Статус', order.status],
        ['Оплата', order.paymentStatus],
      ],
    });
  }

  async notifyOrderStatusChanged(input: {
    order: OrderNotification;
    fromStatus: string;
    toStatus: string;
    comment?: string | null;
  }) {
    return this.send({
      subject: `Заказ ${input.order.number}: статус изменён`,
      title: 'Изменён статус заказа',
      rows: [
        ['Номер заказа', input.order.number],
        ['Клиент', input.order.customerName ?? input.order.leadName ?? '—'],
        ['Было', input.fromStatus],
        ['Стало', input.toStatus],
        ['Комментарий', input.comment ?? '—'],
      ],
    });
  }

  async notifyPaymentAdded(order: OrderNotification, amount: number) {
    return this.send({
      subject: `Заказ ${order.number}: поступил платёж`,
      title: 'Добавлен платёж',
      rows: [
        ['Номер заказа', order.number],
        ['Клиент', order.customerName ?? order.leadName ?? '—'],
        ['Сумма платежа', amount],
        ['Статус оплаты', order.paymentStatus],
        ['Статус заказа', order.status],
      ],
    });
  }

  private async send(input: {
    subject: string;
    title: string;
    rows: Array<[string, string | number]>;
  }) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.NOTIFICATION_EMAIL_FROM?.trim();
    const recipients = (process.env.NOTIFICATION_EMAIL_TO ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!apiKey || !from || recipients.length === 0) {
      this.logger.warn(
        'Email notifications are disabled: configure RESEND_API_KEY, NOTIFICATION_EMAIL_FROM and NOTIFICATION_EMAIL_TO',
      );
      return false;
    }

    const html = this.renderHtml(input.title, input.rows);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject: input.subject,
          html,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        this.logger.error(
          `Email notification failed with HTTP ${response.status}: ${details.slice(0, 500)}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Email notification request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private renderHtml(title: string, rows: Array<[string, string | number]>) {
    const body = rows
      .map(([label, value]) => `<tr><td style="padding:6px 12px;font-weight:600">${this.escapeHtml(label)}</td><td style="padding:6px 12px">${this.escapeHtml(String(value))}</td></tr>`)
      .join('');

    return `<!doctype html><html><body style="font-family:Arial,sans-serif"><h2>${this.escapeHtml(title)}</h2><table cellspacing="0" cellpadding="0">${body}</table></body></html>`;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
