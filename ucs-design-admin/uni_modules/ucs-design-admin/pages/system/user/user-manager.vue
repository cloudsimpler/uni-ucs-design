<template>
	<ucs-admin-layout :title="accountLabel + '管理'" mode="table" :pagination="pagination" @change="onPaginationChange">
		<template #button>
			<el-button v-if="selectedUsers.length" @click="clearSelection">清空选择</el-button>
			<el-button v-if="canCreate" type="primary" :icon="Plus" :disabled="saving || preparing" @click="openEditor()">
				新增{{ accountLabel }}
			</el-button>
			<el-button :icon="Refresh" :loading="loading" :disabled="saving" :aria-label="'刷新' + accountLabel + '列表'" @click="refresh" />
		</template>
		<template #header>
			<el-form inline class="user-search" @submit.prevent="search">
				<el-form-item>

					<el-input
						v-model="filters.keyword"
                        aria-label="关键词" :prefix-icon="Search"
						:placeholder="developer ? '请输入账号' : isEmployee ? '账号、昵称或手机号' : '请输入UID或手机号'"
						maxlength="80"
						clearable
						@clear="search"
					/>
				</el-form-item>
				<el-form-item v-if="!customer">
					<el-select aria-label="角色" v-model="filters.role" placeholder="全部角色" clearable @change="search">
						<el-option label="全部角色" value="" />
						<el-option
							v-for="item in options.roles"
							:key="item.role_id"
							:label="item.role_name"
							:value="item.role_id"
						/>
					</el-select>
				</el-form-item>
                <el-form-item v-if="!customer"><el-select v-model="filters.department_id" clearable placeholder="全部部门" @change="search"><el-option v-for="item in departmentOptions" :key="item._id" :value="item._id" :label="item.label" /></el-select></el-form-item>
				<el-form-item>
					<el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
					<el-button @click="resetFilters">重置</el-button>
				</el-form-item>
			</el-form>
		</template>
		<div class="user-content">
			<el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="user-alert" />
			<el-alert
				v-if="optionsError"
				:title="optionsError"
				type="warning"
				show-icon
				:closable="false"
				class="user-alert"
			/>
			<div class="user-table">
				<el-table
					ref="tableRef"
					v-loading="loading"
					:data="users"
					:header-cell-style="{ textAlign: 'center' }"
					:cell-style="({ column }) => ({ textAlign: column.property === 'username' ? 'left' : 'center' })"
					row-key="_id"
					height="100%"
					@selection-change="selectedUsers = $event"
				>
					<template #empty>
						<el-empty :image-size="100" :description="'暂无符合条件的' + accountLabel" />
					</template>
					<el-table-column type="selection" width="48" fixed="left" :selectable="() => !loading && !saving" />
					<el-table-column
						label="序号"
						type="index"
						width="64"
						:index="(index) => (pagination.current - 1) * pagination.size + index + 1"
					/>
					<el-table-column prop="username" :label="developer ? '账号' : accountLabel" min-width="184">
						<template #default="{ row }">
							<div class="user-identity is-left">
								<el-avatar :size="34" :src="row.avatarPreview">
									{{ accountDisplayName(row).slice(0, 1).toUpperCase() }}
								</el-avatar>
								<div class="user-identity-text">
									<div class="user-name">
										<text class="user-nickname" :title="accountDisplayName(row)">
											{{ accountDisplayName(row) }}
										</text>
										<el-tag v-if="row._id === auth?.uid" size="small" type="info">本人</el-tag>
									</div>
									<div class="user-account-line">
										<text class="user-secondary user-account" :title="row.username || '第三方登录用户'">{{ row.username || '第三方登录用户' }}</text>
										<el-tag v-if="row.is_root" size="small" type="warning">初始管理员</el-tag>
									</div>
								</div>
							</div>
						</template>
					</el-table-column>
					<el-table-column v-if="customer" prop="user_no" label="UID" min-width="140">
                        <template #default="{ row }">{{ row.user_no || '—' }}</template>
                    </el-table-column>
					<el-table-column label="手机号" min-width="132" show-overflow-tooltip>
						<template #default="{ row }">{{ row.mobile || '—' }}</template>
					</el-table-column>
					<el-table-column v-if="!customer" label="角色" min-width="120">
						<template #default="{ row }">
							<div class="user-tags">
								<el-tag v-for="id in row.role" :key="id" size="small">{{ roleName(id) }}</el-tag>
								<text v-if="!row.role?.length" class="user-secondary">未分配</text>
							</div>
						</template>
					</el-table-column>
					<el-table-column label="状态" width="88">
						<template #default="{ row }">
							<el-tag :type="statuses[row.status || 0]?.type || 'info'">
								{{ statuses[row.status || 0]?.label || '未知状态' }}
							</el-tag>
						</template>
					</el-table-column>
					<el-table-column v-if="customer" label="注册时间" min-width="168">
						<template #default="{ row }">{{ formatDate(row.register_date) }}</template>
					</el-table-column>
					<el-table-column label="最后登录" min-width="168">
						<template #default="{ row }">
							<div>{{ formatDate(row.last_login_date) }}</div>
							<text class="user-secondary">{{ row.last_login_ip || '—' }}</text>
						</template>
					</el-table-column>
					<el-table-column label="标签" min-width="90">
						<template #default="{ row }">
							<div class="user-tags">
								<el-tag v-for="id in row.tags" :key="id" size="small" type="info">{{ tagName(id) }}</el-tag>
								<text v-if="!row.tags?.length" class="user-secondary">—</text>
							</div>
						</template>
					</el-table-column>
					<el-table-column label="操作" fixed="right" :width="canWrite || canChangeStatus || canResetPassword || canDelete ? 196 : 88">
						<template #default="{ row }">
							<el-button
								size="small"
								plain
								type="primary"
								:disabled="saving || preparing"
								@click="openEditor(row, true)"
							>
								详情
							</el-button>
							<el-button
								v-if="canWrite && canManage(row)"
								size="small"
								type="primary"
								:disabled="saving || preparing"
								@click="openEditor(row)"
							>
								编辑
							</el-button>
							<el-dropdown
								v-if="(canChangeStatus || canResetPassword || canDelete) && canManage(row) && (!customer || [0, 1].includes(row.status || 0))"
								trigger="click"
								:disabled="saving || preparing || row._id === auth?.uid"
								@command="(command) => onUserAction(command, row)"
							>
								<el-button size="small" :disabled="saving || preparing || row._id === auth?.uid">
									更多
									<el-icon><ArrowDown /></el-icon>
								</el-button>
								<template #dropdown>
									<el-dropdown-menu>
										<el-dropdown-item v-if="canResetPassword" command="password">重置密码</el-dropdown-item>
										<el-dropdown-item v-if="canChangeStatus" :disabled="row.is_root" :command="(row.status || 0) === 0 ? 'disable' : 'enable'">
											{{ (row.status || 0) === 0 ? '禁用账号' : '恢复正常' }}
										</el-dropdown-item>
										<el-dropdown-item v-if="canDelete" command="delete" divided :disabled="row.is_root || row._id === auth?.uid" style="color: var(--el-color-danger)">
											移除
										</el-dropdown-item>
									</el-dropdown-menu>
								</template>
							</el-dropdown>
						</template>
					</el-table-column>
				</el-table>
			</div>
		</div>
	</ucs-admin-layout>
	<UserDetail
		ref="detailRef"
		v-model="detailVisible"
		:uid="detailUid"
		:account-label="accountLabel"
		:customer="customer"
		:detail-method="customer ? 'getCustomerDetail' : developer ? 'getDeveloperDetail' : 'getUserDetail'"
		:options="{ ...options, apps: appOptions }"
		:busy="saving || preparing"
		@edit="(row) => openEditor(row)"
		@edit-roles="(row) => openEditor(row, false, true)"
		@reset-password="(row) => onUserAction('password', row)"
	/>

	<el-dialog
		v-model="editorVisible"
		:title="readOnly ? accountLabel + '详情' : (editingId ? '编辑' : '新增') + accountLabel"
		width="680px"
		align-center
		class="user-editor admin-form-dialog"
		:class="{ 'employee-create-dialog': isEmployee && !editingId }"
		modal-class="user-editor-overlay"
		append-to-body
		@opened="onEditorOpened"
		:close-on-click-modal="false"
		:close-on-press-escape="!saving && !avatarUploading && !enrollmentBusy"
		:show-close="!saving && !avatarUploading && !enrollmentBusy"
		destroy-on-close
	>
		<template v-if="isEmployee && !editingId" #header>
            <h2 class="employee-create-title">新增系统用户</h2>
            <div class="employee-create-steps" aria-label="新增系统用户步骤">
                <span :class="{ active: !enrollmentChecked }" :aria-current="!enrollmentChecked ? 'step' : undefined">1. 查找账号</span>
                <span class="employee-step-divider">/</span>
                <span :class="{ active: enrollmentChecked }" :aria-current="enrollmentChecked ? 'step' : undefined">2. 完善系统用户信息</span>
            </div>
        </template>
		<el-alert v-if="formError" :title="formError" type="error" show-icon :closable="false" class="user-form-alert" />
		<el-form
			ref="formRef"
			:model="form"
			label-position="right"
			label-width="108px"
			:disabled="saving || readOnly || enrollmentBusy"
			class="user-editor-form"
			@submit.prevent="isEmployee && !editingId && !enrollmentChecked ? findEnrollmentAccount() : saveUser()"
		>
            <div v-if="!editingId && !developer" class="user-verification">
                <div v-if="isEmployee && !enrollmentChecked" class="employee-lookup-intro">
                    <h3>先查找系统用户的账号</h3>
                    <p>查找到已有账号后可开通系统用户身份，没有账号则继续创建。</p>
                </div>
                <el-form-item v-if="!isEmployee || !enrollmentChecked" :label="isEmployee ? '手机号' : '核验手机号'" :required="!developer">
                    <el-input ref="enrollmentMobileRef" v-model.trim="enrollmentMobile" :placeholder="isEmployee ? '请输入系统用户手机号' : '输入手机号后点击核验'" maxlength="11" @input="invalidateEnrollment" @keydown.enter.prevent @keyup.enter.stop="findEnrollmentAccount">
                        <template v-if="!isEmployee" #append><el-button :loading="enrollmentBusy" :disabled="saving || avatarUploading" @click="findEnrollmentAccount">核验</el-button></template>
                    </el-input>
                    <span class="user-field-help">查询该手机号是否已有账号，不代表已验证手机号归属。</span>
                </el-form-item>
                <el-button v-if="developer && !enrollmentMobile && !enrollmentChecked" text type="primary" @click="skipMobileCheck">不填手机号，直接新建</el-button>
                <el-alert v-if="enrollmentError" :title="enrollmentError" type="error" :closable="false" show-icon />
                <div v-if="isEmployee && enrollmentChecked" class="employee-match-summary">
                    <div><strong>{{ enrollmentMobile }}</strong><el-tag size="small" :type="enrollmentAccount ? 'primary' : 'info'">{{ enrollmentAccount ? '已有账号' : '新账号' }}</el-tag></div>
                    <el-button text type="primary" :disabled="saving || avatarUploading || enrollmentBusy" @click="invalidateEnrollment">更换手机号</el-button>
                </div>
                <el-alert v-else-if="!isEmployee && enrollmentChecked && !enrollmentAccount && enrollmentMobile" title="该手机号尚未注册，请填写以下信息创建账号。" type="success" :closable="false" show-icon />
                <div v-if="enrollmentAccount" class="enrollment-account-card">
                    <el-avatar :size="56" :src="enrollmentAccount.avatarPreview">{{ (enrollmentAccount.nickname || enrollmentAccount.username || '用').slice(0, 1) }}</el-avatar>
                    <div class="enrollment-account-info">
                        <strong>{{ enrollmentAccount.nickname || enrollmentAccount.username || '未设置昵称' }}</strong>
                        <span>手机号：{{ enrollmentAccount.mobile }}</span>
                        <span>注册时间：{{ formatDate(enrollmentAccount.register_date) }}</span>
                        <div class="enrollment-identities"><span>已有身份：</span><el-tag v-for="type in enrollmentAccount.account_type" :key="type" size="small">{{ ['系统用户', '社区用户'][type] }}</el-tag></div>
                    </div>
                </div>
                <el-alert v-if="enrollmentAccount && !enrollmentCanEnroll" :title="enrollmentAccount.status !== 0 ? '该账号已停用或注销，不能添加身份。' : '该账号已具有' + accountLabel + '身份，无需重复添加。'" type="warning" :closable="false" show-icon />
                <el-button v-if="enrollmentAlready && enrollmentAccount?.status === 0 && (auth?.isAdmin || auth?.permissions?.includes(developer ? 'READ_UNI_ID_DEVELOPERS' : 'READ_UNI_ID_USERS'))" text type="primary" @click="viewMatchedAccount">查看{{ accountLabel }}</el-button>
            </div>
            <template v-if="!editingId && enrollmentAccount && enrollmentCanEnroll">
                <el-form-item label="手机号"><el-input v-model="form.mobile" disabled /></el-form-item>
                <el-form-item label="昵称" required><el-input v-model.trim="enrollmentProfile.nickname" placeholder="请输入昵称" :disabled="!!enrollmentAccount.nickname" maxlength="100" /></el-form-item>
                <template v-if="enrollmentAccount.has_password !== true">
                    <el-form-item label="初始密码" prop="password" :rules="passwordRules"><el-input v-model="form.password" placeholder="请输入初始密码" type="password" show-password maxlength="64" autocomplete="new-password" /></el-form-item>
                    <el-form-item label="确认密码" prop="confirm" :rules="[{ required: true, message: '请再次输入密码' }, { validator: confirmInitialPassword }]"><el-input v-model="form.confirm" placeholder="请再次输入密码" type="password" show-password maxlength="64" autocomplete="new-password" /></el-form-item>
                </template>
                <el-form-item v-if="![1, 2].includes(enrollmentAccount.gender)" label="性别" required><el-radio-group v-model="enrollmentProfile.gender"><el-radio :value="1">男</el-radio><el-radio :value="2">女</el-radio></el-radio-group></el-form-item>
                <el-form-item v-if="!developer" label="所属部门"><el-tree-select v-model="enrollmentProfile.department_id" :data="departmentTree" node-key="_id" :props="{ value: '_id', label: 'name', children: 'children', disabled: 'disabled' }" check-strictly filterable clearable placeholder="请选择所属部门" style="width:100%" /></el-form-item>
                <el-form-item label="追加角色"><el-select v-model="enrollmentProfile.role" placeholder="请选择角色" multiple clearable><el-option v-for="item in options.roles" :key="item.role_id" :value="item.role_id" :label="item.role_name" /></el-select></el-form-item>
                <el-alert :title="'本次为原账号添加' + accountLabel + '身份，' + (enrollmentAccount.has_password === true ? '继续使用原密码' : '同时设置登录密码') + '，保留已有资料、角色和应用授权。'" type="info" :closable="false" show-icon />
            </template>
            <template v-if="editingId || (enrollmentChecked && !enrollmentAccount)">
			<div class="user-editor-section">
				<h3 class="user-editor-section-title">基本信息</h3>
				<div class="user-editor-grid">


					<el-form-item
						label="账号"
						prop="username"
						:rules="[
							{ required: !editingId, message: '请输入账号' },
							{ pattern: /^$|^(?!\d+$)[A-Za-z0-9_-]+$/, message: '仅支持字母、数字、下划线和连字符，不能为纯数字' }
						]"
					>
						<el-input
							v-model.trim="form.username"
							:disabled="saving || readOnly || Boolean(original.username)"
							maxlength="80"
							placeholder="请输入账号"
							autocomplete="off"
						/>
					</el-form-item>
					<el-form-item
						label="昵称"
						prop="nickname"
						:rules="[{ required: !isEmployee || !editingId, whitespace: true, message: '请输入昵称' }, { validator: validateNickname }]"
					>
						<el-input v-model.trim="form.nickname" placeholder="请输入昵称" maxlength="100" />
					</el-form-item>
					<template v-if="!editingId">
						<el-form-item class="user-field-full" label="初始密码" prop="password" :rules="passwordRules">
							<el-input
								v-model="form.password" placeholder="请输入初始密码"
								type="password"
								show-password
								maxlength="64"
								autocomplete="new-password"
							/>
							<text class="user-field-help">至少 6 位，需符合系统配置的密码强度要求。</text>
						</el-form-item>
						<el-form-item
							class="user-field-full"
							label="确认密码"
							prop="confirm"
							:rules="[{ required: true, message: '请再次输入密码' }, { validator: confirmInitialPassword }]"
						>
							<el-input
								v-model="form.confirm" placeholder="请再次输入密码"
								type="password"
								show-password
								maxlength="64"
								autocomplete="new-password"
							/>
						</el-form-item>
					</template>
					<el-form-item label="性别" prop="gender" :rules="[{ required: requiresProfile, type: 'enum', enum: requiresProfile ? [1, 2] : [0, 1, 2], message: '请选择男或女' }]">
						<el-radio-group v-model="form.gender">
							<el-radio v-if="!requiresProfile" :value="0">保密</el-radio>
							<el-radio :value="1">男</el-radio>
							<el-radio :value="2">女</el-radio>
						</el-radio-group>
					</el-form-item>
					<el-form-item
						v-if="!developer && !original.is_root"
						label="手机号"
						prop="mobile"
						:rules="[{ required: isEmployee && !original.is_root, message: '请输入手机号' }, { pattern: /^$|^1\d{10}$/, message: '请输入有效的 11 位手机号' }]"
					>
						<el-input v-model.trim="form.mobile" placeholder="请输入手机号" maxlength="11" :disabled="!editingId || editMobileBusy" @input="invalidateEditMobile">
                            <template v-if="editingId && !developer && !customer" #append><el-button :loading="editMobileBusy" :disabled="!editMobileNeedsCheck || saving" @click="checkEditMobile">{{ editMobileVerified === form.mobile && editMobileNeedsCheck ? '已核验' : '核验' }}</el-button></template>
                        </el-input>
                        <span v-if="editingId && !developer && !customer && editMobileNeedsCheck" class="user-field-help">{{ editMobileVerified === form.mobile ? '新手机号核验通过，保存后生效。' : '手机号已变更，请先核验再保存。' }}</span>
                        <span v-if="editMobileError" class="user-avatar-error">{{ editMobileError }}</span>
					</el-form-item>
					<el-form-item label="头像" class="user-avatar-field">
						<div class="user-profile-strip">
							<el-upload
								ref="avatarUploadRef"
								class="user-avatar-uploader"
								accept="image/jpeg,image/png,image/webp"
								:show-file-list="false"
								:disabled="saving || readOnly || avatarUploading"
								:before-upload="beforeAvatarUpload"
								:http-request="uploadUserAvatar"
								:on-success="clearAvatarFiles"
								:on-error="avatarUploadFailed"
							>
								<div
									class="user-avatar-trigger"
									:aria-label="form.avatar ? '更换头像' : '上传头像'"
									:aria-busy="avatarUploading"
								>
									<el-image v-if="form.avatar" :src="form.avatarPreview" fit="cover" class="user-avatar-preview">
										<template #error><span class="user-field-help">预览不可用</span></template>
									</el-image>
									<div v-else class="user-avatar-placeholder">
										<el-icon :size="24"><Plus /></el-icon>
										<text>上传头像</text>
									</div>
									<div v-if="avatarUploading" class="user-avatar-mask">
										<el-icon class="is-loading"><Loading /></el-icon>
										<text>上传中</text>
									</div>
									<div v-else-if="form.avatar && !readOnly" class="user-avatar-replace">更换头像</div>
								</div>
							</el-upload>
							<div class="user-profile-caption">
								<text class="user-field-help">支持 JPG、PNG、WebP 图片{{ editingId ? '，上传后立即保存' : '' }}</text>
								<el-progress v-if="avatarUploading" :percentage="avatarProgress" :stroke-width="4" />
								<text v-if="avatarError" class="user-avatar-error">{{ avatarError }}</text>
							</div>
						</div>
					</el-form-item>
				</div>
			</div>
			<div v-if="!original.is_root" class="user-editor-section">
				<h3 class="user-editor-section-title">{{ customer ? '社区用户标签' : '组织与标签' }}</h3>
				<div class="user-editor-grid">
					<el-form-item v-if="!customer" label="所属部门">
						<el-tree-select v-model="form.department_id" :data="departmentTree" node-key="_id" :props="{ value: '_id', label: 'name', children: 'children', disabled: 'disabled' }" check-strictly filterable clearable placeholder="请选择所属部门" style="width:100%" />
					</el-form-item>
					<el-form-item label="用户标签">
						<el-select
							v-model="form.tags"
							multiple
							filterable
							clearable
							placeholder="请选择标签"
							no-data-text="暂无可选标签"
						>
							<el-option v-for="item in options.tags" :key="item.tagid" :label="item.name" :value="item.tagid" />
						</el-select>
					</el-form-item>
				</div>
			</div>
			<div v-if="!customer && !original.is_root" class="user-editor-section">
				<h3 class="user-editor-section-title">账号与授权</h3>
				<div class="user-editor-grid">
					<el-form-item ref="roleItemRef" label="角色">
						<el-select
							v-model="form.role"
							multiple
							clearable
							filterable
							:disabled="saving || readOnly"
							placeholder="请选择角色"
						>
							<el-option
								v-for="item in options.roles"
								:key="item.role_id"
								:label="item.role_name"
								:value="item.role_id"
								:disabled="original.is_root && item.role_id === 'admin'"
							/>
						</el-select>
					</el-form-item>

					<el-form-item
						class="user-field-full user-app-mode"
						label="登录权限"
						label-position="right"
						label-width="108px"
					>
						<el-radio-group v-model="appAccessMode" :disabled="original.is_root && (original.dcloud_appid == null || original.dcloud_appid.includes('*'))">
							<el-radio-button value="partial">部分应用</el-radio-button>
							<el-radio-button value="all">全部应用</el-radio-button>
						</el-radio-group>
					</el-form-item>
					<el-form-item
						v-if="appAccessMode === 'partial'"
						class="user-field-full user-app-selection"
						label="可登录的应用"
						label-position="right"
						label-width="108px"
					>
						<el-checkbox-group v-model="form.authorizedApp" class="user-app-checkboxes">
							<el-checkbox
								v-for="item in selectableApps"
								:key="item.appid"
								:value="item.appid"
								:disabled="original.is_root && original.dcloud_appid?.includes(item.appid)"
								border
								:title="item.appid"
							>
								{{ item.name }}
							</el-checkbox>
						</el-checkbox-group>
						<text v-if="!form.authorizedApp.length" class="user-field-help">
							未选择应用，该用户将不能登录任何应用。
						</text>
					</el-form-item>
					<text class="user-field-help user-access-help">修改角色或应用授权后，原有登录会失效。</text>
				</div>
			</div>
			<el-alert
				v-if="isSelf && !original.is_root"
				title="修改本人授权后需重新登录。"
				type="info"
				:closable="false"
				class="user-editor-notice"
			/>
            </template>
		</el-form>
		<template #footer>
			<el-button :disabled="saving || avatarUploading || enrollmentBusy" @click="editorVisible = false">
				{{ readOnly ? '关闭' : '取消' }}
			</el-button>
			<el-button v-if="isEmployee && !editingId && !enrollmentChecked" type="primary" :loading="enrollmentBusy" @click="findEnrollmentAccount">查找并继续</el-button>
			<el-button v-else-if="!readOnly" type="primary" :loading="saving || enrollmentBusy" :disabled="avatarUploading || editMobileBusy || (editMobileNeedsCheck && editMobileVerified !== form.mobile) || (!editingId && (!enrollmentChecked || (enrollmentAccount && !enrollmentCanEnroll)))" @click="saveUser">
				{{ editingId ? '保存' : enrollmentAccount ? '添加' + accountLabel + '身份' : '创建' + accountLabel }}
			</el-button>
		</template>
	</el-dialog>

	<el-dialog
		v-model="passwordVisible"
		:title="resetCredentials ? '密码重置成功' : '重置密码'"
		append-to-body
		align-center
		width="min(90vw, 460px)"
		:close-on-click-modal="false"
		:close-on-press-escape="!saving"
		:show-close="!saving"
		destroy-on-close
	>
		<template #header="{ titleId, titleClass }">
			<div class="password-dialog-heading">
				<span v-if="resetCredentials" class="password-success-icon"><el-icon><Check /></el-icon></span>
				<span :id="titleId" :class="titleClass">{{ resetCredentials ? '密码重置成功' : '重置密码' }}</span>
			</div>
		</template>
		<div v-if="resetCredentials" class="password-result">
			<p class="password-result-description">请复制以下登录信息，交给账号使用者。</p>
			<div class="password-credential-card">
				<div class="password-account-row">
					<span class="password-field-label">账号</span>
					<span class="password-account-value">{{ resetCredentials.username }}</span>
				</div>
				<div class="password-value-section">
					<span class="password-field-label">新密码</span>
					<span class="password-generated-value">{{ resetCredentials.password }}</span>
				</div>
			</div>
		</div>
		<el-alert
			v-else
			:title="'确定重置 ' + (passwordUser.username || passwordUser.nickname || '该用户') + ' 的密码？系统将随机生成新密码，重置成功后显示。'"
			type="warning"
			:closable="false"
			show-icon
		/>
		<el-alert v-if="formError" :title="formError" type="error" :closable="false" class="user-form-alert" />
		<template #footer>
			<el-button :disabled="saving" @click="passwordVisible = false">{{ resetCredentials ? '关闭' : '取消' }}</el-button>
			<el-button v-if="resetCredentials" type="primary" :icon="CopyDocument" @click="copyResetCredentials">复制账号和密码</el-button>
			<el-button v-else type="primary" :loading="saving" @click="resetPassword">确认重置</el-button>
		</template>
	</el-dialog>

</template>

<script setup>
import '../../../common/form-dialog.css';
import { ElAlert, ElAvatar, ElButton, ElCheckbox, ElCheckboxGroup, ElDialog, ElDropdown, ElDropdownItem, ElDropdownMenu, ElEmpty, ElForm, ElFormItem, ElIcon, ElImage, ElInput, ElOption, ElProgress, ElRadio, ElRadioButton, ElRadioGroup, ElSelect, ElTreeSelect, ElTable, ElTableColumn, ElTag, ElUpload, vLoading } from 'element-plus';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/avatar/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/checkbox/style/css.mjs';
import 'element-plus/es/components/checkbox-group/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/dropdown/style/css.mjs';
import 'element-plus/es/components/dropdown-item/style/css.mjs';
import 'element-plus/es/components/dropdown-menu/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/image/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/option/style/css.mjs';
import 'element-plus/es/components/progress/style/css.mjs';
import 'element-plus/es/components/radio/style/css.mjs';
import 'element-plus/es/components/radio-button/style/css.mjs';
import 'element-plus/es/components/radio-group/style/css.mjs';
import 'element-plus/es/components/select/style/css.mjs';
import 'element-plus/es/components/tree-select/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/table-column/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/upload/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/message-box/style/css.mjs';

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Search, ArrowDown, Loading, Check, CopyDocument } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import manifest from '@/manifest.json';
import UserDetail from './user-detail.vue';
import { uploadAvatarImage, resolveUserAvatars } from '../../../common/avatar.js';
import store from '@/uni_modules/ucs-design-admin/common/store.js';

const props = defineProps({ developer: Boolean, customer: Boolean });
const accountLabel = computed(() => props.customer ? '社区用户' : props.developer ? '开发者' : '系统用户');
const customerMethods = { listUsers: 'listCustomers', getUserOptions: 'getCustomerOptions', updateUser: 'updateCustomer' };
const developerMethods = {
	listUsers: 'listDevelopers', getUserOptions: 'getDeveloperOptions',
	addUser: 'addDeveloper', updateUser: 'updateDeveloper', resetUserPassword: 'resetDeveloperPassword'
};
const api = uniCloud.importObject('uni-id-co', { customUI: true });
const statuses = [
	{ label: '正常', type: 'success' },
	{ label: '禁用', type: 'danger' },
	{ label: '待审核', type: 'warning' },
	{ label: '审核拒绝', type: 'danger' },
	{ label: '已注销', type: 'info' }
];
const editableStatuses = computed(() => props.developer ? statuses.slice(0, 4) : statuses);
const users = ref([]),
	auth = ref(null),
	options = ref({ roles: [], tags: [], apps: [], departments: [] });
const loading = ref(false),
	saving = ref(false),
	preparing = ref(false),
	error = ref(''),
	optionsError = ref('');
const filters = reactive({ keyword: '', status: '', role: '', department_id: '' }),
	applied = reactive({ ...filters });
const pagination = reactive({ current: 1, size: 20, count: 0 });
const tableRef = ref();
const selectedUsers = ref([]);
const clearSelection = () => {
	tableRef.value?.clearSelection();
	selectedUsers.value = [];
};
const canWrite = computed(() => auth.value?.update === true);
const canChangeStatus = computed(() => props.customer && auth.value?.status === true);
const canCreate = computed(() => !props.customer && auth.value?.create === true);
const canResetPassword = computed(() => !props.customer && auth.value?.resetPassword === true);
const canDelete = computed(() => !props.customer && auth.value?.delete === true);
const canManage = (row) => auth.value?.isAdmin || !(row?.role || []).includes('admin');
const appOptions = computed(() => [
	{ appid: '*', name: '全部应用' },
	{ appid: manifest.appid, name: manifest.name + '（当前应用）' },
	...options.value.apps.filter((item) => item.appid !== manifest.appid && item.appid !== '*')
]);
const roleName = (id) =>
	options.value.roles.find((item) => item.role_id === id)?.role_name || (id === 'admin' ? '超级管理员' : id);
const tagName = (id) => options.value.tags.find((item) => item.tagid === id)?.name || id;
const departmentOptions = computed(() => {
	const departments = options.value.departments || [];
	const byId = new Map(departments.map((item) => [item._id, item]));
	return [...departments]
		.sort((a, b) => (a.sort || 0) - (b.sort || 0))
		.map((item) => {
			const names = [item.name],
				seen = new Set([item._id]);
			let disabled = item.enabled === false;
			let parent = byId.get(item.parent_id);
			while (parent && !seen.has(parent._id)) {
				disabled = disabled || parent.enabled === false;
				names.unshift(parent.name);
				seen.add(parent._id);
				parent = byId.get(parent.parent_id);
			}
			return { ...item, disabled, label: names.join(' / ') + (disabled ? '（停用）' : '') };
		});
});
const departmentTree = computed(() => {
 const nodes = new Map(departmentOptions.value.map(row => [row._id, { ...row, children: [] }])), roots = [];
 for (const node of nodes.values()) {
  let parent = nodes.get(node.parent_id), current = parent; const seen = new Set([node._id]);
  while(current && !seen.has(current._id)) { seen.add(current._id); current = nodes.get(current.parent_id); }
  if(current) parent = null;
  if(parent) parent.children.push(node); else roots.push(node);
 }
 return roots;
});
const formatDate = (value) => (value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—');
const accountDisplayName = (row) => row.nickname || row.username || '未设置昵称';
const message = (e) => e?.errMsg || e?.message || '操作失败，请稍后重试';
const call = async (method, params) => {
	const result = await api[props.customer ? customerMethods[method] || method : props.developer ? developerMethods[method] || method : method](params);
	if (result.errCode) throw result;
	return result;
};
let requestId = 0,
	disposed = false;
const load = async (current = pagination.current) => {
	const id = ++requestId;
	clearSelection();
	loading.value = true;
	error.value = '';
	try {
		const result = await call('listUsers', { ...applied, current, size: pagination.size });
		result.data = await resolveUserAvatars(result.data, uniCloud);
		if (disposed || id !== requestId) return;
		users.value = result.data;
		auth.value = result.auth;
		Object.assign(pagination, result.pagination);
		await nextTick();
		tableRef.value?.setScrollTop(0);
	} catch (e) {
		if (!disposed && id === requestId) {
			users.value = [];
			pagination.count = 0;
			error.value = message(e);
			if (/FORBIDDEN|UNAUTHORIZED/.test(String(e?.errCode))) auth.value = null;
		}
	} finally {
		if (!disposed && id === requestId) loading.value = false;
	}
};
const loadOptions = async () => {
	const result = await call('getUserOptions');
	if (!disposed) {
		options.value = result;
		auth.value = result.auth;
		optionsError.value = '';
	}
};
const refresh = () =>
	Promise.all([
		load(),
		loadOptions().catch((e) => {
			optionsError.value = '选项加载失败：' + message(e);
		})
	]);
const search = () => {
	Object.assign(applied, filters);
	load(1);
};
const resetFilters = () => {
	Object.assign(filters, { keyword: '', status: '', role: '', department_id: '' });
	search();
};
const onPaginationChange = (value) => {
	Object.assign(pagination, value);
	load();
};
onMounted(refresh);
onBeforeUnmount(() => {
	disposed = true;
	requestId++;
});

const enrollmentMobile = ref(''), enrollmentAccount = ref(null), enrollmentError = ref(''), enrollmentBusy = ref(false);
const enrollmentChecked = ref(false), enrollmentCanEnroll = ref(false), enrollmentAlready = ref(false), enrollmentSnapshot = ref('');
let enrollmentRequest = 0;
const enrollmentProfile = reactive({ nickname: '', gender: undefined, role: [], department_id: '' });
const invalidateEnrollment = () => {
    enrollmentRequest++;
    enrollmentChecked.value = false; enrollmentAccount.value = null; enrollmentError.value = '';
    enrollmentCanEnroll.value = false; enrollmentAlready.value = false; enrollmentSnapshot.value = '';
    formError.value = ''; form.value.mobile = '';
    form.value.password = ''; form.value.confirm = '';
    Object.assign(enrollmentProfile, { nickname: '', gender: undefined, role: [], department_id: '' });
};
const skipMobileCheck = () => {
    if (!props.developer || enrollmentMobile.value || enrollmentBusy.value) return;
    invalidateEnrollment(); enrollmentChecked.value = true;
};
const findEnrollmentAccount = async () => {
    if (enrollmentBusy.value || saving.value || avatarUploading.value || !canCreate.value) return;
    invalidateEnrollment();
    if (!/^1\d{10}$/.test(enrollmentMobile.value)) { enrollmentError.value = '请输入有效的 11 位手机号'; return; }
    const id = enrollmentRequest, mobile = enrollmentMobile.value;
    enrollmentBusy.value = true;
    try {
        const result = await call(props.developer ? 'findAccountForDeveloper' : 'findAccountForEmployee', { mobile });
        const data = result.data ? (await resolveUserAvatars([result.data], uniCloud))[0] : null;
        if (disposed || id !== enrollmentRequest || !editorVisible.value) return;
        enrollmentAccount.value = data; enrollmentChecked.value = true;
        enrollmentCanEnroll.value = result.canEnroll === true; enrollmentAlready.value = result.alreadyEnrolled === true;
        enrollmentSnapshot.value = result.snapshot || ''; form.value.mobile = mobile;
        Object.assign(enrollmentProfile, { nickname: data?.nickname || '' });
    } catch (error) { if (!disposed && id === enrollmentRequest) enrollmentError.value = message(error); }
    finally { enrollmentBusy.value = false; }
};
const viewMatchedAccount = () => {
    if (!enrollmentAlready.value || !enrollmentAccount.value) return;
    detailUid.value = enrollmentAccount.value._id; editorVisible.value = false; detailVisible.value = true;
};
const submitEnrollment = async () => {
    if (enrollmentBusy.value || saving.value || !enrollmentAccount.value || !enrollmentCanEnroll.value || !canCreate.value) return;
    if (!enrollmentAccount.value.nickname && !enrollmentProfile.nickname.trim()) { enrollmentError.value = '请输入昵称'; return; }
    if (![1, 2].includes(enrollmentAccount.value.gender) && ![1, 2].includes(enrollmentProfile.gender)) { enrollmentError.value = '请选择男或女'; return; }
    const needsPassword = enrollmentAccount.value.has_password !== true;
    if (needsPassword) {
        if (!form.value.password || form.value.password.length < 6 || form.value.password.length > 64) { enrollmentError.value = '请输入 6–64 位密码'; return; }
        if (form.value.password !== form.value.confirm) { enrollmentError.value = '两次密码不一致'; return; }
    }
    enrollmentBusy.value = true; enrollmentError.value = '';
    try {
        await call(props.developer ? 'enrollDeveloper' : 'enrollEmployee', { uid: enrollmentAccount.value._id, snapshot: enrollmentSnapshot.value,
            ...(!enrollmentAccount.value.nickname && { nickname: enrollmentProfile.nickname }), gender: enrollmentProfile.gender, role: enrollmentProfile.role,
            ...(needsPassword ? { password: form.value.password } : {}),
            ...(!props.developer ? { department_id: enrollmentProfile.department_id ? [enrollmentProfile.department_id] : [] } : {}) });
        form.value.password = ''; form.value.confirm = '';
        editorVisible.value = false; ElMessage.success(accountLabel.value + '身份已添加'); await refresh();
    } catch (error) { enrollmentError.value = message(error); }
    finally { enrollmentBusy.value = false; }
};

const editorVisible = ref(false),
	readOnly = ref(false),
	editingId = ref(''),
	original = ref({}),
	form = ref({}),
	formError = ref('');
const partialAppSelection = ref([]);
const appAccessMode = computed({
	get: () => (form.value.authorizedApp?.includes('*') ? 'all' : 'partial'),
	set: (mode) => {
		if (mode === 'all') {
			partialAppSelection.value = [...(form.value.authorizedApp || [])].filter((id) => id !== '*');
			form.value.authorizedApp = ['*'];
		} else {
			form.value.authorizedApp = [...partialAppSelection.value];
		}
	}
});
const selectableApps = computed(() => {
	const apps = appOptions.value.filter((item) => item.appid !== '*');
	const known = new Set(apps.map((item) => item.appid));
	// Keep existing custom AppIDs visible and removable even if their app record is absent.
	for (const id of original.value.dcloud_appid || []) {
		if (id !== '*' && !known.has(id)) {
			apps.push({ appid: id, name: id });
			known.add(id);
		}
	}
	return apps;
});
const formRef = ref();
const editMobileBusy = ref(false), editMobileVerified = ref(''), editMobileError = ref('');
let editMobileRequest = 0;
const editMobileNeedsCheck = computed(() => Boolean(editingId.value) && !props.developer && !props.customer && form.value.mobile !== (original.value.mobile || ''));
const invalidateEditMobile = () => { editMobileRequest++; editMobileVerified.value = ''; editMobileError.value = ''; };
const checkEditMobile = async () => {
    if (editMobileBusy.value || saving.value || readOnly.value || !canWrite.value || !editMobileNeedsCheck.value) return;
    invalidateEditMobile();
    const mobile = form.value.mobile, uid = editingId.value, request = editMobileRequest;
    if (!/^1\d{10}$/.test(mobile)) { editMobileError.value = '请输入有效的 11 位手机号'; return; }
    editMobileBusy.value = true;
    try {
        await call('checkEmployeeMobile', { uid, mobile });
        if (disposed || request !== editMobileRequest || !editorVisible.value || uid !== editingId.value || mobile !== form.value.mobile) return;
        editMobileVerified.value = mobile;
        ElMessage.success('手机号核验通过');
    } catch (error) {
        if (request === editMobileRequest && editorVisible.value) editMobileError.value = message(error);
    } finally { editMobileBusy.value = false; }
};
const detailRef = ref(),
	detailVisible = ref(false),
	detailUid = ref(''),
	roleItemRef = ref();
let focusRoleOnOpen = false;
const onEditorOpened = () => {
	if (!editingId.value && isEmployee.value) enrollmentMobileRef.value?.focus();
	if (focusRoleOnOpen) roleItemRef.value?.$el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	focusRoleOnOpen = false;
};
const isSelf = computed(() => Boolean(editingId.value) && editingId.value === auth.value?.uid);
const isEmployee = computed(() => !props.developer && !props.customer);
const enrollmentMobileRef = ref();
watch(enrollmentChecked, async () => {
    if (!isEmployee.value || editingId.value || !editorVisible.value) return;
    await nextTick();
    const root = formRef.value?.$el;
    root?.closest('.el-dialog__body')?.scrollTo({ top: 0 });
    if (!enrollmentChecked.value) enrollmentMobileRef.value?.focus();
    else root?.querySelector('input:not(:disabled)')?.focus({ preventScroll: true });
});
const requiresProfile = computed(() => (isEmployee.value && !original.value.is_root) || !editingId.value);
const passwordRules = [
	{ required: true, message: '请输入密码' },
	{ min: 6, max: 64, message: '密码长度应为 6–64 位' }
];
const validateNickname = (rule, value, callback) =>
	callback(value && (value.includes('@') || /^\d+$/.test(value)) ? new Error('昵称不能包含 @ 或为纯数字') : undefined);
const avatarUploading = ref(false),
	avatarProgress = ref(0),
	avatarError = ref('');
const avatarUploadRef = ref();
const clearAvatarFiles = () => avatarUploadRef.value?.clearFiles();
const avatarUploadFailed = (error) => {
	clearAvatarFiles();
	if (!disposed) avatarError.value = message(error);
};
const beforeAvatarUpload = (file) => {
	if (saving.value || readOnly.value || avatarUploading.value || disposed || !editorVisible.value) return false;
	avatarError.value = '';
	if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size) {
		avatarError.value = '请选择有效的 JPG、PNG 或 WebP 图片';
		return false;
	}
	return true;
};
const uploadUserAvatar = async ({ file, onProgress }) => {
	const currentForm = form.value;
	const targetUid = editingId.value;
	avatarUploading.value = true;
	avatarProgress.value = 0;
	avatarError.value = '';
	const filePath = URL.createObjectURL(file);
	let uploaded = false;
	try {
		const avatar = await uploadAvatarImage(
			{ path: filePath, type: file.type, size: file.size },
			{
				storage: uniCloud,
				checkImage: (src) => uni.getImageInfo({ src }),
				onProgress: (value) => {
					avatarProgress.value = value;
					onProgress({ percent: value });
				}
			}
		);
		uploaded = true;
		if (targetUid) {
			await call('updateUser', { uid: targetUid, avatar: avatar.avatar });
			if (targetUid === uniCloud.getCurrentUserInfo().uid) store.userInfoVersion++;
		}
		if (!disposed) {
			if (form.value === currentForm) {
				Object.assign(form.value, avatar);
				if (targetUid) Object.assign(original.value, avatar);
			}
			if (targetUid) {
				const row = users.value.find((user) => user._id === targetUid);
				if (row) Object.assign(row, avatar);
				detailRef.value?.updateAvatar(targetUid, avatar);
				ElMessage.success('头像已更新');
			}
		}
		return avatar;
	} catch (e) {
		throw new Error((uploaded ? '图片已上传，头像保存失败：' : '头像上传失败：') + message(e));
	} finally {
		URL.revokeObjectURL(filePath);
		avatarUploading.value = false;
	}
};
const confirmInitialPassword = (rule, value, callback) =>
	callback(value === form.value.password ? undefined : new Error('两次密码不一致'));
const openEditor = async (row, detail = false, focusRole = false) => {
	if (saving.value || preparing.value) return;
	if (detail) {
		detailUid.value = row._id;
		detailVisible.value = true;
		return;
	}
	focusRoleOnOpen = focusRole;
	preparing.value = true;
	try {
		if (!(row ? canWrite.value && canManage(row) : canCreate.value) || disposed) return;
		// 列表已包含全部编辑字段和头像预览，直接回填，避免打开弹窗时重复请求。
		original.value = row ? JSON.parse(JSON.stringify(row)) : {};
		editingId.value = row?._id || '';
		readOnly.value = detail;
        enrollmentMobile.value = ''; invalidateEnrollment();
        if (props.developer && !row) enrollmentChecked.value = true;
        invalidateEditMobile();
		formError.value = '';
		avatarError.value = '';
		form.value = {
			username: row?.username || '',
			nickname: row?.nickname || '',
			avatar: row?.avatar || '',
			avatarPreview: row?.avatarPreview || '',
			gender: requiresProfile.value ? ([1, 2].includes(row?.gender) ? row.gender : undefined) : (row?.gender ?? 0),
			department_id: row?.department_id?.[0] || '',
			mobile: row?.mobile || '',
			email: row?.email || '',
			role: [...(row?.role || [])],
			tags: [...(row?.tags || [])],
			status: row?.status || 0,
			authorizedApp: row ? [...(row.dcloud_appid ?? ['*'])] : ['*'],
			password: '',
			confirm: ''
		};
		partialAppSelection.value = form.value.authorizedApp.filter((id) => id !== '*');
		editorVisible.value = true;
		await nextTick();
		formRef.value?.clearValidate();
	} catch (e) {
		ElMessage.error(message(e));
	} finally {
		preparing.value = false;
	}
};
const saveUser = async () => {
    if (editMobileBusy.value || (editMobileNeedsCheck.value && editMobileVerified.value !== form.value.mobile)) {
        formError.value = '请先核验新手机号'; return;
    }
    if (!editingId.value) {
        if (!enrollmentChecked.value || enrollmentBusy.value) return;
        if (enrollmentAccount.value) return submitEnrollment();
    }
	if (
		saving.value ||
		avatarUploading.value ||
		readOnly.value ||
		!(editingId.value ? canWrite.value : canCreate.value) ||
		!(await formRef.value.validate().catch(() => false))
	)
		return;
	saving.value = true;
	formError.value = '';
	try {
		const {
			username,
			nickname,
			avatar,
			gender,
			department_id,
			mobile,
			role,
			tags,
			status,
			authorizedApp,
			password
		} = form.value;
		const params = {
			nickname,
			gender,
			department_id: department_id ? [department_id] : [],
			mobile,
			tags,
			role
		};

        if (props.developer) delete params.mobile;
        if (original.value.is_root) { delete params.mobile; delete params.email; }
		if (!editingId.value || avatar !== (original.value.avatar || '')) params.avatar = avatar;
		if (username && !props.customer) params.username = username;
		// 保留历史账号未限制应用的存储方式，避免仅修改资料时意外变更授权。
		if (
			!(
				editingId.value &&
				original.value.dcloud_appid == null &&
				authorizedApp.length === 1 &&
				authorizedApp[0] === '*'
			)
		)
			params.authorizedApp = authorizedApp;
		if (original.value.is_root) {
			for (const key of ['department_id', 'tags', 'role', 'authorizedApp']) delete params[key];
		}
		if (props.customer) {
			delete params.role;
			delete params.status;
			delete params.authorizedApp;
			delete params.department_id;
			for (const key of Object.keys(params)) {
				const previous = original.value[key] ?? (key === 'gender' ? 0 : key === 'tags' ? [] : '');
				if (JSON.stringify(params[key]) === JSON.stringify(previous)) delete params[key];
			}
		}
		if (editingId.value) params.uid = editingId.value;
		else params.password = password;
		const result = await call(editingId.value ? 'updateUser' : 'addUser', params);
		if (editingId.value === uniCloud.getCurrentUserInfo().uid && !result.requireLogin) store.userInfoVersion++;
		editorVisible.value = false;
		form.value.password = '';
		form.value.confirm = '';
		if (result.requireLogin) {
			detailVisible.value = false;
			store.isLogin = false;
			uni.removeStorageSync('uni_id_token');
			uni.removeStorageSync('uni_id_token_expired');
			ElMessage.success(accountLabel.value + '已保存，授权已更新，请重新登录');
			uni.reLaunch({ url: '/uni_modules/ucs-design-admin/pages/login/login' });
			return;
		}
		ElMessage.success(accountLabel.value + '保存成功');
		if (detailVisible.value) await detailRef.value?.reload();
		await load(editingId.value ? pagination.current : 1);
	} catch (e) {
		formError.value = message(e) + (!editingId.value && (e.errCode === 'uni-id-account-exists' || e.errCode === 'ACCOUNT_EXISTS') ? '，请重新核验手机号；若账号被其他人使用，请核对后修改。' : '');
	} finally {
		saving.value = false;
	}
};
const passwordVisible = ref(false),
	resetCredentials = ref(null),
	passwordUser = ref({});
watch(editorVisible, (visible) => {
	if (!visible) {
        invalidateEditMobile();
        enrollmentRequest++;
		form.value.password = '';
		form.value.confirm = '';
	}
});
watch(passwordVisible, (visible) => {
	if (!visible) {
		resetCredentials.value = null;
	}
});
const copyResetCredentials = () => {
	if (!resetCredentials.value) return;
	uni.setClipboardData({
		data: `账号：${resetCredentials.value.username}\n密码：${resetCredentials.value.password}`,
		showToast: false,
		success: () => ElMessage.success('账号和密码已复制'),
		fail: () => ElMessage.error('复制失败，请手动复制')
	});
};
const onUserAction = async (command, row) => {
	if (
		!(command === 'delete' ? canDelete.value : command === 'password' ? canResetPassword.value : canChangeStatus.value) ||
		!canManage(row) ||
		saving.value ||
		row._id === auth.value?.uid
	)
		return;
	if (command === 'delete') {
		if (row.is_root) return;
		try {
			await ElMessageBox.confirm(`确定移除${accountLabel.value}“${row.username || row.nickname || row._id}”吗？${(row.account_type || []).length > 1 ? "仅移除当前身份，其他身份保留；不再具有后台身份时清空角色。" : "当前仅有此身份，操作将删除整个账号。"}`, '移除' + accountLabel.value, {
				type: 'warning', confirmButtonText: '移除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger'
			});
		} catch { return; }
		saving.value = true;
		try {
			await call(props.developer ? 'deleteDeveloper' : 'deleteUser', { uid: row._id });
			if (detailUid.value === row._id) detailVisible.value = false;
			ElMessage.success(accountLabel.value + '已移除');
			await load();
		} catch (e) { ElMessage.error(message(e)); }
		finally { saving.value = false; }
		return;
	}
	if (command === 'close') return;
	if (props.customer && ![0, 1].includes(row.status || 0)) return;
	if (command === 'password') {
		resetCredentials.value = null;
		passwordUser.value = row;
		formError.value = '';
		passwordVisible.value = true;
		return;
	}
	if (!props.customer) return;
	const status = { disable: 1, enable: 0 }[command];
	if (row.is_root && status !== undefined) return;
	if (status === undefined) return;
	const action = { disable: '禁用', enable: '恢复正常', close: '注销' }[command];
	try {
		await ElMessageBox.confirm(
			`确定将“${row.username || row.nickname || row._id}”${action}？` +
                ((row.account_type || []).includes(0)
                    ? `该账号还具有系统用户身份，本次将${status === 1 ? '同时停止社区用户端和管理后台访问' : '恢复整个账号的访问资格'}。`
                    : (status === 1 ? '禁用后将无法登录和使用系统。' : '恢复后可正常登录。')),
            '账号状态确认',
            { type: status === 0 ? 'info' : 'warning', confirmButtonText: status === 1 ? '禁用整个账号' : '恢复账号' }
		);
	} catch {
		return;
	}
	saving.value = true;
	try {
		await call('setCustomerStatus', { uid: row._id, status, expectedAccountTypes: row.account_type });
		ElMessage.success('账号状态已更新');
		await load();
	} catch (e) {
		ElMessage.error(message(e));
		if (e.errCode === 'ACCOUNT_IDENTITY_CHANGED') await load();
	} finally {
		saving.value = false;
	}
};
const resetPassword = async () => {
	if (saving.value || resetCredentials.value) return;
	saving.value = true;
	formError.value = '';
	try {
		const result = await call('resetUserPassword', { uid: passwordUser.value._id });
		if (!disposed) resetCredentials.value = { username: result.username, password: result.password };
	} catch (e) {
		formError.value = message(e);
	} finally {
		saving.value = false;
	}
};
</script>

<style scoped>
.user-verification { margin-bottom: 24px; }
.enrollment-account-card { display: flex; align-items: flex-start; gap: 16px; padding: 20px; margin: 16px 0; border: 1px solid var(--el-border-color-light); border-radius: 8px; background: var(--el-fill-color-light); }
.enrollment-account-card .el-avatar { flex-shrink: 0; }
.enrollment-account-info { display: flex; flex-direction: column; gap: 8px; min-width: 0; overflow-wrap: anywhere; color: var(--el-text-color-regular); }
.enrollment-account-info strong { color: var(--el-text-color-primary); font-size: 16px; }
.enrollment-identities { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.user-content {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
}
.user-search {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}
.user-search .el-form-item {
	margin: 0;
}
.user-search .el-input {
	width: 240px;
	max-width: 100%;
}
.user-search .el-select {
	width: 140px;
}
.user-alert {
	flex-shrink: 0;
}
.user-table {
	flex: 1;
	min-height: 0;
	min-width: 0;
}
.user-identity {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
}
.user-identity .el-avatar {
	flex-shrink: 0;
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
}
.user-identity.is-left,
.user-identity.is-left .user-name {
	justify-content: flex-start;
}
.user-identity-text {
	min-width: 0;
	max-width: calc(100% - 44px);
}
.user-identity.is-left .user-identity-text {
	flex: 1;
}
.user-account-line {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 2px;
	min-width: 0;
	text-align: left;
}
.user-name {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	font-weight: 500;
	line-height: 22px;
}
.user-nickname,
.user-account {
	display: block;
	min-width: 0;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
.user-identity .el-tag {
	flex-shrink: 0;
}
.user-secondary {
	color: var(--el-text-color-secondary);
	font-size: 12px;
	overflow-wrap: anywhere;
}
.user-tags {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 4px;
}
.user-table .el-button + .el-button {
	margin-left: 6px;
}
.user-table .el-dropdown {
	margin-left: 6px;
	vertical-align: middle;
}
.user-field-help {
	display: block;
	margin-top: 6px;
	color: var(--el-text-color-secondary);
	font-size: 12px;
	line-height: 1.6;
}
.user-form-alert {
	margin-bottom: 16px;
}
.password-dialog-heading {
	display: flex;
	align-items: center;
	gap: 10px;
}
.password-success-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	flex-shrink: 0;
	border-radius: 50%;
	background: var(--el-color-success-light-9);
	color: var(--el-color-success);
	font-size: 20px;
}
.password-result {
	padding: 4px 0 8px;
}
.password-result-description {
	margin: 0 0 18px;
	color: var(--el-text-color-secondary);
	font-size: 14px;
	line-height: 1.6;
}
.password-credential-card {
	padding: 0 20px;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 8px;
	background: var(--el-fill-color-light);
}
.password-account-row {
	display: flex;
	align-items: baseline;
	gap: 20px;
	padding: 16px 0;
	border-bottom: 1px solid var(--el-border-color-lighter);
}
.password-field-label {
	flex-shrink: 0;
	color: var(--el-text-color-secondary);
	font-size: 13px;
	line-height: 1.5;
}
.password-account-value {
	min-width: 0;
	color: var(--el-text-color-primary);
	font-size: 15px;
	font-weight: 500;
	overflow-wrap: anywhere;
	user-select: text;
}
.password-value-section {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 16px 0 20px;
}
.password-generated-value {
	color: var(--el-color-primary);
	font-family: Consolas, 'Courier New', monospace;
	font-size: 28px;
	font-weight: 600;
	line-height: 1.4;
	letter-spacing: 3px;
	overflow-wrap: anywhere;
	user-select: all;
}
.user-profile-strip {
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
	min-width: 0;
	align-items: flex-start;
}
.user-avatar-uploader {
	flex-shrink: 0;
}
.user-avatar-uploader :deep(.el-upload) {
	border: 1px dashed var(--el-border-color);
	border-radius: 6px;
	overflow: hidden;
	background: var(--el-bg-color);
	transition: border-color 0.2s;
}
.user-avatar-uploader :deep(.el-upload:hover),
.user-avatar-uploader :deep(.el-upload:focus-visible) {
	border-color: var(--el-color-primary);
}
.user-avatar-trigger {
	position: relative;
	width: 96px;
	height: 96px;
	line-height: 1.5;
}
.user-avatar-preview {
	display: block;
	width: 100%;
	height: 100%;
}
.user-avatar-placeholder,
.user-avatar-mask {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	height: 100%;
	font-size: 12px;
}
.user-avatar-placeholder {
	color: var(--el-text-color-secondary);
}
.user-avatar-replace,
.user-avatar-mask {
	position: absolute;
	inset: auto 0 0;
	background: var(--el-overlay-color-light);
	color: #fff;
	font-size: 12px;
	text-align: center;
}
.user-avatar-replace {
	padding: 4px 0;
}
.user-avatar-mask {
	inset: 0;
	cursor: wait;
}
.user-profile-caption {
	width: 100%;
	min-width: 0;
}
.user-profile-caption .user-field-help {
	margin-top: 0;
}
.user-editor-section + .user-editor-section {
	margin-top: 28px;
}
.user-editor-section-title {
	display: flex;
	align-items: center;
	gap: 12px;
	margin: 0 0 20px;
	font-size: 14px;
	line-height: 20px;
	font-weight: 600;
	color: var(--el-text-color-primary);
}
.user-editor-section-title::after {
	content: '';
	flex: 1;
	height: 1px;
	background: var(--el-border-color-lighter);
}
.user-editor-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 20px;
}
.user-editor-grid :deep(.el-form-item) {
	margin-bottom: 0;
	min-width: 0;
}
.user-editor-grid :deep(.el-form-item__label) {
	margin-bottom: 0;
	padding-right: 20px;
	color: var(--el-text-color-regular);
}
.user-editor-grid :deep(.el-form-item__content) {
	min-width: 0;
}
.user-avatar-field :deep(.el-form-item__label) {
	align-self: flex-start;
}
.user-editor-grid > .user-access-help {
	box-sizing: border-box;
	min-width: 0;
	padding-left: 108px;
	margin: -8px 0 0;
	overflow-wrap: anywhere;
}
.user-editor-grid .user-field-full {
	grid-column: 1 / -1;
}
.user-editor-grid .user-field-help {
	width: 100%;
}
.user-app-checkboxes {
	display: flex;
	flex-wrap: wrap;
	gap: 8px 12px;
	width: 100%;
}
.user-app-checkboxes :deep(.el-checkbox.is-bordered) {
	margin: 0;
	max-width: 100%;
	height: auto;
	min-height: 32px;
	padding: 6px 16px;
}
.user-app-checkboxes :deep(.el-checkbox__label) {
	white-space: normal;
	overflow-wrap: anywhere;
}
.user-editor-notice {
	margin-top: 16px;
}
.user-avatar-error {
	display: block;
	color: var(--el-color-danger);
	font-size: 12px;
}
:global(.user-editor) {
	max-width: calc(100vw - 32px);
	max-height: calc(100vh - 48px);
	max-height: calc(100dvh - 48px);
	display: flex;
	flex-direction: column;
	margin: 0 auto;
	padding: 0;
	overflow: hidden;
	border-radius: 8px;
}
:global(.user-editor-overlay .el-overlay-dialog) {
	overflow: hidden;
}
:global(.user-editor > .el-dialog__header) {
	flex-shrink: 0;
	margin: 0;
	padding: 20px;
	border-bottom: 1px solid var(--el-border-color-light);
}
:global(.user-editor > .el-dialog__body) {
	min-height: 0;
	padding: 24px;
	overflow-y: auto;
	overscroll-behavior: contain;
}
:global(.user-editor > .el-dialog__footer) {
	flex-shrink: 0;
	padding: 16px 20px;
	border-top: 1px solid var(--el-border-color-light);
}
:global(.user-editor .el-select) {
	width: 100%;
}
.employee-create-title { margin: 0; font-size: 18px; font-weight: 600; }
.employee-create-steps { display: flex; align-items: center; gap: 16px; margin-top: 14px; font-size: 14px; color: var(--el-text-color-secondary); }
.employee-create-steps .active { color: var(--el-color-primary); font-weight: 600; }
.employee-step-divider { color: var(--el-border-color); }
.employee-lookup-intro { margin: 28px 0 32px 108px; }
.employee-lookup-intro h3 { margin: 0 0 12px; font-size: 18px; color: var(--el-text-color-primary); }
.employee-lookup-intro p { margin: 0; line-height: 1.6; color: var(--el-text-color-secondary); }
.employee-match-summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; margin-bottom: 24px; background: var(--el-fill-color-light); border-radius: 6px; }
.employee-match-summary > div { display: flex; align-items: center; gap: 12px; }
:global(.user-editor.employee-create-dialog) { height: min(680px, calc(100dvh - 48px)); }
:global(.employee-create-dialog > .el-dialog__body) { flex: 1; }
@media (max-width: 600px) { .employee-lookup-intro { margin-left: 0; } }
</style>
