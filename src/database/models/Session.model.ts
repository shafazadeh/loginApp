import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'sessions',
  timestamps: true,
})
export class Session extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @Column({
    allowNull: false,
  })
  declare deviceId: string;

  @Default(DataType.NOW)
  @Column
  declare lastActiveAt: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare revokedAt: Date | null;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expiresAt: Date;
}
