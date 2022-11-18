import { InternalServerError } from '@0x/api-utils';
import axios from 'axios';

import { ORDER_WATCHER_URL , LOG_CSV_PATH} from '../config';
import { ValidationError } from '../errors';
import { SignedLimitOrder } from '../types';
import fs from 'fs';

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
    }).format(date);
};

export interface OrderWatcherInterface {
    postOrdersAsync(orders: SignedLimitOrder[]): Promise<void>;
}

export class OrderWatcher implements OrderWatcherInterface {
    public async postOrdersAsync(orders: SignedLimitOrder[]): Promise<void> {
        try {
            await axios.post(`${ORDER_WATCHER_URL}/orders`, orders, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 1000,
            });
            fs.appendFile(LOG_CSV_PATH, `${formatDate(new Date())},${orders.toString()}`, (err) => {
                throw err;
            })
        } catch (err) {
            if (err.response.data) {
                throw new ValidationError(err.response.data.validationErrors);
            } else if (err.request) {
                throw new InternalServerError('failed to submit order to order-watcher');
            } else {
                throw new InternalServerError('failed to prepare the order-watcher request');
            }
        }
    }
}
