import { PartialType } from '@nestjs/mapped-types';
import { CreatePcBuildDto } from './create-pc-build.dto.js';

export class UpdatePcBuildDto extends PartialType(CreatePcBuildDto) {}
