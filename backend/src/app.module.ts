import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PcBuildsModule } from './pc-builds/pc-builds.module.js';
import { LeadsModule } from './leads/leads.module.js';
import { ConfiguratorModule } from './configurator/configurator.module.js';
import { ComponentsModule } from './components/components.module.js';
import { PcBuildComponentsModule } from './pc-build-components/pc-build-components.module.js';
import { CompatibilityRulesModule } from './compatibility-rules/compatibility-rules.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { SiteSettingsModule } from './site-settings/site-settings.module.js';
import { ServicesModule } from './services/services.module.js';
import { PortfolioModule } from './portfolio/portfolio.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

@Module({ imports: [PrismaModule, AuthModule, PcBuildsModule, LeadsModule, ConfiguratorModule, ComponentsModule, PcBuildComponentsModule, CompatibilityRulesModule, OrdersModule, NotificationsModule, SiteSettingsModule, ServicesModule, PortfolioModule, ReviewsModule], controllers: [AppController], providers: [AppService] })
export class AppModule {}
