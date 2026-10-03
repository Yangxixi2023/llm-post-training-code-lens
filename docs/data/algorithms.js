const makeAlgorithm = (value) => ({
  ...value,
  lineCount: value.code.length,
  segmentMap: Object.fromEntries(value.segments.map((segment) => [segment.id, segment]))
})

export const algorithms = [
  makeAlgorithm({
    id: 'mha',
    label: 'MHA',
    name: 'Multi-Head Attention',
    group: '注意力机制',
    summary: '同一组 Q、K、V 分成多个头，各自建模不同关系，再拼接回隐藏维度。',
    memory: '投影 → 分头 → 缩放点积 → softmax 加权 → 拼接输出',
    formula: 'Attention(Q,K,V) = softmax(QKᵀ / √dₖ)V',
    code: [
      'def mha(x, w_q, w_k, w_v, w_o, num_heads):',
      '    B, T, D = x.shape',
      '    head_dim = D // num_heads',
      '    q = x @ w_q',
      '    k = x @ w_k',
      '    v = x @ w_v',
      '    q = q.view(B, T, num_heads, head_dim).transpose(1, 2)',
      '    k = k.view(B, T, num_heads, head_dim).transpose(1, 2)',
      '    v = v.view(B, T, num_heads, head_dim).transpose(1, 2)',
      '    scores = q @ k.transpose(-2, -1)',
      '    scores = scores / (head_dim ** 0.5)',
      '    weights = softmax(scores, dim=-1)',
      '    context = weights @ v',
      '    context = context.transpose(1, 2).contiguous()',
      '    context = context.view(B, T, D)',
      '    return context @ w_o'
    ],
    segments: [
      { id: 'A', label: 'Q / K / V 投影', range: [1, 6] },
      { id: 'B', label: '分头与转置', range: [7, 10] },
      { id: 'C', label: '缩放点积', range: [11, 13] },
      { id: 'D', label: '加权求和', range: [14, 16] },
      { id: 'E', label: '拼接输出', range: [17, 20] }
    ],
    focus: [4, 8, 11, 14, 17]
  }),
  makeAlgorithm({
    id: 'gqa',
    label: 'GQA',
    name: 'Grouped-Query Attention',
    group: '注意力机制',
    summary: 'Q 保留更多头，K/V 只保留更少的组，再复制到对应 Q 头，降低 KV cache。',
    memory: 'Q 多头、KV 少头 → repeat_kv 对齐 → 与 MHA 相同的注意力核',
    formula: 'hₖᵥ = h_q / n_rep，K,V 沿 head 维复制 n_rep 次',
    code: [
      'def gqa(x, w_q, w_k, w_v, w_o, q_heads, kv_heads):',
      '    B, T, D = x.shape',
      '    q_dim = D // q_heads',
      '    q = (x @ w_q).view(B, T, q_heads, q_dim).transpose(1, 2)',
      '    k = (x @ w_k).view(B, T, kv_heads, q_dim).transpose(1, 2)',
      '    v = (x @ w_v).view(B, T, kv_heads, q_dim).transpose(1, 2)',
      '    repeat = q_heads // kv_heads',
      '    k = k.repeat_interleave(repeat, dim=1)',
      '    v = v.repeat_interleave(repeat, dim=1)',
      '    scores = q @ k.transpose(-2, -1) / (q_dim ** 0.5)',
      '    weights = softmax(scores, dim=-1)',
      '    context = weights @ v',
      '    context = context.transpose(1, 2).reshape(B, T, D)',
      '    return context @ w_o'
    ],
    segments: [
      { id: 'A', label: 'Q / KV 头数', range: [1, 4] },
      { id: 'B', label: 'KV 组复制', range: [5, 9] },
      { id: 'C', label: '注意力核', range: [10, 12] },
      { id: 'D', label: '输出投影', range: [13, 15] }
    ],
    focus: [2, 5, 10, 13]
  }),
  makeAlgorithm({
    id: 'ppo',
    label: 'PPO',
    name: 'Proximal Policy Optimization',
    group: '在线对齐',
    summary: '用旧策略采样，用 GAE 估计优势，再用 clipped ratio 限制策略单次更新幅度。',
    memory: 'rollout → GAE → ratio → clip → policy/value loss → update',
    formula: 'Lᵖ = −min(rₜAₜ, clip(rₜ,1−ε,1+ε)Aₜ)',
    code: [
      'def ppo_loss(batch, policy, value, old_logp, clip_eps=0.2):',
      '    logits = policy(batch.states)',
      '    logp = categorical(logits).log_prob(batch.actions)',
      '    values = value(batch.states).squeeze(-1)',
      '    deltas = batch.rewards + batch.gamma * batch.next_values - values',
      '    advantages = discounted_sum(deltas, batch.gamma * batch.lam)',
      '    advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)',
      '    ratio = (logp - old_logp).exp()',
      '    unclipped = ratio * advantages',
      '    clipped = ratio.clamp(1 - clip_eps, 1 + clip_eps) * advantages',
      '    policy_loss = -torch.minimum(unclipped, clipped).mean()',
      '    value_loss = 0.5 * (values - batch.returns).pow(2).mean()',
      '    entropy = categorical(logits).entropy().mean()',
      '    return policy_loss + value_loss - 0.01 * entropy'
    ],
    segments: [
      { id: 'A', label: '策略与价值前向', range: [1, 4] },
      { id: 'B', label: 'GAE 优势估计', range: [5, 8] },
      { id: 'C', label: '重要性比率', range: [9, 10] },
      { id: 'D', label: 'clip 策略损失', range: [11, 13] },
      { id: 'E', label: '价值与熵正则', range: [14, 16] }
    ],
    focus: [2, 6, 9, 11, 14]
  }),
  makeAlgorithm({
    id: 'dpo',
    label: 'DPO',
    name: 'Direct Preference Optimization',
    group: '离线对齐',
    summary: '用 chosen / rejected 偏好对比较策略与参考模型的 log-ratio，直接得到二分类损失。',
    memory: '拼接偏好对 → 序列 logprob → policy/ref 差值 → logsigmoid → 反传',
    formula: 'L = −log σ(β[(log π−log πᵣ)ᶜ − (log π−log πᵣ)ʳ])',
    code: [
      'def dpo_loss(policy, reference, batch, beta=0.1):',
      '    chosen = sequence_logprob(policy, batch.prompt, batch.chosen)',
      '    rejected = sequence_logprob(policy, batch.prompt, batch.rejected)',
      '    with torch.no_grad():',
      '        ref_chosen = sequence_logprob(reference, batch.prompt, batch.chosen)',
      '        ref_rejected = sequence_logprob(reference, batch.prompt, batch.rejected)',
      '    chosen_reward = beta * (chosen - ref_chosen)',
      '    rejected_reward = beta * (rejected - ref_rejected)',
      '    margin = chosen_reward - rejected_reward',
      '    loss = -F.logsigmoid(margin).mean()',
      '    accuracy = (margin > 0).float().mean()',
      '    return loss, accuracy'
    ],
    segments: [
      { id: 'A', label: 'chosen / rejected', range: [1, 3] },
      { id: 'B', label: '序列 logprob', range: [2, 4] },
      { id: 'C', label: 'Reference 冻结', range: [5, 6] },
      { id: 'D', label: '隐式奖励差', range: [7, 9] },
      { id: 'E', label: 'logsigmoid 损失', range: [10, 12] }
    ],
    focus: [2, 3, 5, 7, 10]
  }),
  makeAlgorithm({
    id: 'grpo',
    label: 'GRPO',
    name: 'Group Relative Policy Optimization',
    group: '在线对齐',
    summary: '同一 prompt 采样一组回答，用组内奖励标准化代替独立 Critic，再复用 PPO 风格策略项。',
    memory: '组采样 → verifier/RM → 组内标准化 → token logprob → clip/KL → update',
    formula: 'Aᵢ = (rᵢ − mean(r)) / (std(r)+ε)',
    code: [
      'def grpo_loss(policy, ref, prompts, group_size, beta=0.04):',
      '    responses = sample_group(policy, prompts, group_size)',
      '    rewards = verifier(prompts, responses)',
      '    advantages = group_normalize(rewards)',
      '    logp = response_logprob(policy, prompts, responses)',
      '    with torch.no_grad():',
      '        old_logp = logp.detach()',
      '        ref_logp = response_logprob(ref, prompts, responses)',
      '    ratio = (logp - old_logp).exp()',
      '    clipped = ratio.clamp(1 - 0.2, 1 + 0.2)',
      '    policy_term = torch.minimum(ratio * advantages, clipped * advantages)',
      '    kl = logp - ref_logp - 1 + (ref_logp - logp).exp()',
      '    return -(policy_term - beta * kl).mean()'
    ],
    segments: [
      { id: 'A', label: '组内采样', range: [1, 3] },
      { id: 'B', label: '奖励与优势', range: [4, 6] },
      { id: 'C', label: 'token logprob', range: [7, 9] },
      { id: 'D', label: 'PPO-style clip', range: [10, 12] },
      { id: 'E', label: 'Reference KL', range: [13, 14] }
    ],
    focus: [2, 4, 7, 10, 13]
  })
]

